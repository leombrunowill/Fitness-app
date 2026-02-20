/**
 * nutrition/foodApi.js
 * Plain script — no ES modules. Load with <script src="nutrition/foodApi.js">
 * Exposes window._IronLogFoodApi for use anywhere in the app.
 */
(function () {
  "use strict";

  var USDA_KEY  = window.IRONLOG_USDA_KEY || "DEMO_KEY";
  var USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
  var OFF_BASE  = "https://world.openfoodfacts.org";
  var _cache = {};

  function normalizeUSDA(item) {
    if (!item) return null;
    var n = item.foodNutrients || [];
    function getNutrient(id) {
      for (var i = 0; i < n.length; i++) {
        var fn = n[i];
        var nId = fn.nutrientId || (fn.nutrient && fn.nutrient.id);
        if (nId === id) return +(fn.value || fn.amount || 0);
      }
      return 0;
    }
    var cal  = getNutrient(1008) || getNutrient(2047);
    var prot = getNutrient(1003);
    var carb = getNutrient(1005);
    var fat  = getNutrient(1004);
    var serving = null;
    var portions = item.foodPortions || [];
    if (portions.length) {
      var p = portions[0];
      serving = { label: p.portionDescription || p.modifier || "1 serving", grams: +(p.gramWeight || 100) };
    }
    var name = (item.description || "Unknown").trim().replace(/,\s*/g, " ").replace(/\s+/g, " ");
    return {
      id: "usda_" + item.fdcId, source: "USDA", foodName: name,
      brand: item.brandOwner || item.brandName || null,
      per100: { cal: +cal.toFixed(1), p: +prot.toFixed(1), c: +carb.toFixed(1), f: +fat.toFixed(1) },
      serving: serving, calories: Math.round(cal), protein: +prot.toFixed(1)
    };
  }

  function normalizeOFF(item) {
    if (!item || !item.product_name) return null;
    var n   = item.nutriments || {};
    var cal = +(n["energy-kcal_100g"] || (n["energy_100g"] ? n["energy_100g"] / 4.184 : 0) || 0);
    var p   = +(n["proteins_100g"]      || 0);
    var c   = +(n["carbohydrates_100g"] || 0);
    var f   = +(n["fat_100g"]           || 0);
    if (!cal && !p && !c && !f) return null;
    var serving = null;
    var gMatch  = (item.serving_size || "").match(/([\d.]+)\s*g/i);
    if (gMatch) serving = { label: item.serving_size, grams: parseFloat(gMatch[1]) };
    return {
      id: "off_" + (item.code || Math.random().toString(36).slice(2)),
      source: "OpenFoodFacts", foodName: (item.product_name || "Unknown").trim(),
      brand: item.brands || null,
      per100: { cal: +cal.toFixed(1), p: +p.toFixed(1), c: +c.toFixed(1), f: +f.toFixed(1) },
      serving: serving, image: item.image_small_url || item.image_url || null,
      calories: Math.round(cal), protein: +p.toFixed(1)
    };
  }

  function searchUSDA(query, limit) {
    limit = limit || 12;
    var ck = "usda::" + query.toLowerCase();
    if (_cache[ck]) return Promise.resolve(_cache[ck]);
    var url = USDA_BASE + "/foods/search?api_key=" + encodeURIComponent(USDA_KEY) +
              "&query=" + encodeURIComponent(query) + "&pageSize=" + limit +
              "&dataType=Survey%20(FNDDS),SR%20Legacy,Foundation";
    return fetch(url).then(function(r){ return r.json(); }).then(function(data){
      var results = (data.foods || []).map(normalizeUSDA).filter(Boolean);
      _cache[ck] = results; return results;
    }).catch(function(e){ console.warn("USDA:", e.message); return []; });
  }

  function searchOFF(query, limit) {
    limit = limit || 15;
    var ck = "off::" + query.toLowerCase();
    if (_cache[ck]) return Promise.resolve(_cache[ck]);
    var url = OFF_BASE + "/cgi/search.pl?search_terms=" + encodeURIComponent(query) +
              "&json=1&page_size=" + limit +
              "&fields=product_name,brands,nutriments,serving_size,image_small_url,code&sort_by=popularity";
    return fetch(url).then(function(r){ return r.json(); }).then(function(data){
      var results = (data.products || []).map(normalizeOFF).filter(Boolean);
      _cache[ck] = results; return results;
    }).catch(function(e){ console.warn("OFF:", e.message); return []; });
  }

  function searchFood(query, limit) {
    limit = limit || 20;
    if (!query || query.trim().length < 2) return Promise.resolve([]);
    var ck = "combined::" + query.toLowerCase() + limit;
    if (_cache[ck]) return Promise.resolve(_cache[ck]);
    return Promise.all([
      searchUSDA(query, Math.ceil(limit * 0.55)),
      searchOFF(query, Math.ceil(limit * 0.7))
    ]).then(function(results){
      var usda = results[0], off = results[1], seen = {}, combined = [], all = usda.concat(off);
      for (var i = 0; i < all.length; i++) {
        var item = all[i];
        var key = (item.foodName || "").toLowerCase().slice(0, 30) + "::" + (item.brand || "").toLowerCase().slice(0, 20);
        if (!seen[key]) { seen[key] = true; combined.push(item); }
        if (combined.length >= limit) break;
      }
      _cache[ck] = combined; return combined;
    });
  }

  function lookupBarcode(barcode) {
    if (!barcode) return Promise.resolve(null);
    var ck = "barcode::" + barcode;
    if (_cache[ck]) return Promise.resolve(_cache[ck]);
    var url = OFF_BASE + "/api/v2/product/" + encodeURIComponent(barcode) +
              "?fields=product_name,brands,nutriments,serving_size,image_small_url,code";
    return fetch(url).then(function(r){ return r.json(); }).then(function(data){
      if (data.status !== 1 || !data.product) return null;
      var norm = normalizeOFF(Object.assign({}, data.product, { code: barcode }));
      if (norm) _cache[ck] = norm; return norm;
    }).catch(function(e){ console.warn("Barcode:", e.message); return null; });
  }

  function apiItemToLogEntry(apiFood, grams) {
    if (!apiFood) return null;
    var g = (grams && grams > 0) ? grams : (apiFood.serving ? apiFood.serving.grams : 100);
    var r = g / 100, p = apiFood.per100 || {};
    var nm = apiFood.foodName + (apiFood.brand ? " (" + apiFood.brand + ")" : "");
    return {
      id: Math.random().toString(16).slice(2) + Date.now().toString(16),
      name: nm, source: apiFood.source, apiId: apiFood.id, key: null,
      grams: Math.round(g),
      servings: apiFood.serving ? Math.round((g / apiFood.serving.grams) * 10) / 10 : 0,
      cal: Math.round((p.cal || 0) * r),
      p: Math.round((p.p || 0) * r * 10) / 10,
      c: Math.round((p.c || 0) * r * 10) / 10,
      f: Math.round((p.f || 0) * r * 10) / 10,
      at: Date.now()
    };
  }

  window._IronLogFoodApi = { searchFood: searchFood, searchUSDA: searchUSDA, searchOFF: searchOFF, lookupBarcode: lookupBarcode, apiItemToLogEntry: apiItemToLogEntry };
  console.log("[Iron Log] Food API ready — USDA + Open Food Facts");
})();
