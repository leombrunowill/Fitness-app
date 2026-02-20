/**
 * nutrition/searchFood.js — plain script (no ES modules)
 * Exposes window._IronLogSearchFood = { initSearchFood }
 * Requires window._IronLogFoodApi to be loaded first.
 */
(function () {
  "use strict";

  function debounce(fn, ms) {
    var t = null;
    return function() {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(ctx, args); }, ms);
    };
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function(m) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
    });
  }

  function macroChip(label, value, color) {
    return '<span class="macro-chip" style="--chip:' + color + '">' + label + ' <strong>' + value + '</strong></span>';
  }

  function sourceBadge(source) {
    if (source === "USDA")          return '<span class="source-badge usda">USDA</span>';
    if (source === "OpenFoodFacts") return '<span class="source-badge off">Open Food Facts</span>';
    return '<span class="source-badge local">My Foods</span>';
  }

  function renderSkeleton(count) {
    count = count || 4;
    var out = "";
    for (var i = 0; i < count; i++) {
      out += '<div class="food-result-card skeleton">' +
             '<div class="sk-line" style="width:60%;height:13px;margin-bottom:7px"></div>' +
             '<div class="sk-line" style="width:40%;height:10px"></div>' +
             '</div>';
    }
    return out;
  }

  // ── Favorites & Recent (localStorage) ────────────────────────────────────
  var _favs = {};
  try { _favs = JSON.parse(localStorage.getItem("il_food_favs") || "{}"); } catch(e){}
  function isFav(food)    { return !!_favs[food.id]; }
  function toggleFav(food) {
    if (_favs[food.id]) { delete _favs[food.id]; } else { _favs[food.id] = food; }
    try { localStorage.setItem("il_food_favs", JSON.stringify(_favs)); } catch(e){}
    return !!_favs[food.id];
  }
  function getFavs(limit)   { return Object.values(_favs).slice(0, limit || 8); }

  var _recent = [];
  try { _recent = JSON.parse(localStorage.getItem("il_food_recent") || "[]"); } catch(e){}
  function recordRecent(food) {
    _recent = _recent.filter(function(f){ return f.id !== food.id; });
    _recent.unshift(food);
    _recent = _recent.slice(0, 10);
    try { localStorage.setItem("il_food_recent", JSON.stringify(_recent)); } catch(e){}
  }
  function getRecent(limit) { return _recent.slice(0, limit || 8); }

  // ── Custom food library (persisted) ──────────────────────────────────────
  var _customFoods = [];
  try { _customFoods = JSON.parse(localStorage.getItem("il_custom_foods") || "[]"); } catch(e){}

  function saveCustomFoods() {
    try { localStorage.setItem("il_custom_foods", JSON.stringify(_customFoods)); } catch(e){}
  }

  function addCustomFood(food) {
    // Avoid duplicates by id
    _customFoods = _customFoods.filter(function(f){ return f.id !== food.id; });
    _customFoods.unshift(food);
    saveCustomFoods();
  }

  function deleteCustomFood(id) {
    _customFoods = _customFoods.filter(function(f){ return f.id !== id; });
    saveCustomFoods();
  }

  function getCustomFoods() { return _customFoods.slice(); }

  // ── Food card builder ─────────────────────────────────────────────────────
  function buildFoodCard(food, onLog, onFavToggle, onDelete) {
    var fav    = isFav(food);
    var p100   = food.per100 || {};
    var name   = food.foodName || "Unknown";
    var brand  = food.brand || "";
    var img    = food.image || "";
    var hasSrv = food.serving && food.serving.grams > 0;
    var srvG   = hasSrv ? food.serving.grams : 100;
    var srvLbl = hasSrv ? (food.serving.label || "serving") : null;
    var isCustom = food.source === "Custom";

    var el = document.createElement("div");
    el.className = "food-result-card";
    el.setAttribute("data-food-id", food.id || "");

    var amountHtml;
    if (hasSrv) {
      amountHtml =
        '<div class="log-amount-wrap srv-mode">' +
          '<input class="inp log-servings" type="number" min="0.25" step="0.25" value="1" placeholder="srv">' +
          '<span class="grams-label">' + esc(srvLbl) + '</span>' +
        '</div>' +
        '<button class="gram-toggle-btn" title="Switch to grams">g</button>';
    } else {
      amountHtml =
        '<div class="log-amount-wrap gram-mode">' +
          '<input class="inp log-grams" type="number" min="1" step="1" value="100" placeholder="g">' +
          '<span class="grams-label">g</span>' +
        '</div>';
    }

    var deleteBtn = isCustom
      ? '<button class="custom-delete-btn" data-delete title="Delete from My Foods">🗑</button>'
      : '';

    el.innerHTML =
      '<div class="food-card-top">' +
        (img ? '<img class="food-thumb" src="' + esc(img) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '') +
        '<div class="food-card-info">' +
          '<div class="food-card-name">' + esc(name) + '</div>' +
          (brand ? '<div class="food-card-brand">' + esc(brand) + '</div>' : '') +
          '<div class="food-card-badges">' + sourceBadge(food.source) + '</div>' +
          '<div class="food-card-macros">' +
            macroChip("Cal", Math.round(p100.cal || 0), "#f59e0b") + ' per 100g' +
          '</div>' +
          (hasSrv
            ? '<div class="food-card-serving">1 ' + esc(srvLbl) + ' = ' + srvG + 'g = ' + Math.round((p100.cal||0)*srvG/100) + ' cal</div>'
            : '<div class="food-card-serving">No serving info — entering grams</div>'
          ) +
        '</div>' +
        deleteBtn +
        '<button class="fav-btn ' + (fav ? "on" : "") + '" aria-label="Toggle favorite" data-fav>' +
          (fav ? "⭐" : "☆") +
        '</button>' +
      '</div>' +
      '<div class="food-log-row">' +
        amountHtml +
        '<div class="log-macros-preview" data-preview></div>' +
        '<button class="btn bp log-confirm-btn" data-log>Add</button>' +
      '</div>';

    var previewEl = el.querySelector("[data-preview]");

    function getGrams() {
      var srvInput = el.querySelector(".log-servings");
      var gInput   = el.querySelector(".log-grams");
      if (srvInput) return (parseFloat(srvInput.value) || 1) * srvG;
      return parseFloat(gInput ? gInput.value : 100) || 100;
    }

    function updatePreview() {
      var g = getGrams(), r = g / 100;
      previewEl.textContent =
        Math.round((p100.cal||0)*r) + " cal · " +
        ((p100.p||0)*r).toFixed(1) + "p · " +
        ((p100.c||0)*r).toFixed(1) + "c · " +
        ((p100.f||0)*r).toFixed(1) + "f";
    }
    updatePreview();

    var anyInput = el.querySelector(".log-servings") || el.querySelector(".log-grams");
    if (anyInput) anyInput.addEventListener("input", updatePreview);

    // Serving ↔ gram toggle
    var toggleBtn = el.querySelector(".gram-toggle-btn");
    if (toggleBtn) {
      var inSrvMode = true;
      toggleBtn.addEventListener("click", function() {
        inSrvMode = !inSrvMode;
        var wrap = el.querySelector(".log-amount-wrap");
        if (inSrvMode) {
          wrap.className = "log-amount-wrap srv-mode";
          wrap.innerHTML = '<input class="inp log-servings" type="number" min="0.25" step="0.25" value="1" placeholder="srv"><span class="grams-label">' + esc(srvLbl) + '</span>';
          toggleBtn.textContent = "g";
        } else {
          wrap.className = "log-amount-wrap gram-mode";
          wrap.innerHTML = '<input class="inp log-grams" type="number" min="1" step="1" value="' + srvG + '" placeholder="g"><span class="grams-label">g</span>';
          toggleBtn.textContent = "srv";
        }
        var inp = wrap.querySelector("input");
        if (inp) inp.addEventListener("input", updatePreview);
        updatePreview();
      });
    }

    // Add button
    el.querySelector("[data-log]").addEventListener("click", function() {
      var g   = getGrams();
      var api = window._IronLogFoodApi;
      var entry;
      if (isCustom) {
        // Custom foods already store absolute macros per serving
        var ratio = g / (food.serving ? food.serving.grams : 100);
        entry = {
          id:       Math.random().toString(16).slice(2) + Date.now().toString(16),
          name:     food.foodName + (food.brand ? " (" + food.brand + ")" : ""),
          source:   "Custom",
          apiId:    food.id,
          key:      null,
          grams:    Math.round(g),
          servings: food.serving ? Math.round((g / food.serving.grams) * 10) / 10 : 0,
          cal:      Math.round((food.per100.cal || 0) * g / 100),
          p:        +((food.per100.p || 0) * g / 100).toFixed(1),
          c:        +((food.per100.c || 0) * g / 100).toFixed(1),
          f:        +((food.per100.f || 0) * g / 100).toFixed(1),
          at:       Date.now()
        };
      } else if (api) {
        entry = api.apiItemToLogEntry(food, g);
      } else return;

      recordRecent(food);
      onLog(food, entry, g);
      el.classList.add("logged-flash");
      setTimeout(function(){ el.classList.remove("logged-flash"); }, 800);
    });

    // Fav button
    el.querySelector("[data-fav]").addEventListener("click", function() {
      var nowFav = toggleFav(food);
      this.textContent = nowFav ? "⭐" : "☆";
      this.classList.toggle("on", nowFav);
      if (onFavToggle) onFavToggle(food, nowFav);
    });

    // Delete button (custom foods only)
    var delBtn = el.querySelector("[data-delete]");
    if (delBtn) {
      delBtn.addEventListener("click", function() {
        if (!confirm('Delete "' + food.foodName + '" from My Foods?')) return;
        deleteCustomFood(food.id);
        el.style.opacity = "0";
        el.style.transform = "translateX(30px)";
        el.style.transition = "all .2s";
        setTimeout(function(){ el.remove(); }, 220);
        if (onDelete) onDelete(food);
      });
    }

    return el;
  }

  function renderList(listEl, foods, emptyMsg, onDelete) {
    listEl.innerHTML = "";
    if (!foods || !foods.length) {
      listEl.innerHTML = '<p class="nut-empty">' + esc(emptyMsg) + '</p>';
      return;
    }
    foods.forEach(function(food) {
      listEl.appendChild(buildFoodCard(food, listEl._onLog, listEl._onFav, onDelete));
    });
  }

  // ── Custom food form ──────────────────────────────────────────────────────
  function buildCustomFoodSection(onLog, onSaved) {
    var el = document.createElement("div");
    el.className = "custom-food-section";

    el.innerHTML =
      // My Foods library
      '<div class="nut-section-head" style="margin-bottom:8px">🍱 My Foods</div>' +
      '<div class="food-list" id="nut-list-custom"></div>' +
      // Add new form (collapsible)
      '<div class="custom-food-form" style="margin-top:10px">' +
        '<div class="custom-food-header" id="custom-food-toggle">' +
          '<span>➕ Create New Custom Food</span>' +
          '<span class="custom-food-chevron">▾</span>' +
        '</div>' +
        '<div class="custom-food-body" id="custom-food-body" hidden>' +
          '<div class="custom-food-grid">' +
            '<div class="custom-field cf-full"><label>Food name *</label><input class="inp" id="cf-name" placeholder="e.g. Homemade Pasta" type="text"></div>' +
            '<div class="custom-field cf-full"><label>Serving label</label><input class="inp" id="cf-serving" placeholder="e.g. 1 bowl, 1 slice" type="text"></div>' +
            '<div class="custom-field"><label>Grams per serving</label><input class="inp" id="cf-grams" type="number" min="1" step="1" value="100"></div>' +
            '<div class="custom-field"><label>Calories *</label><input class="inp" id="cf-cal" type="number" min="0" step="1" placeholder="kcal"></div>' +
            '<div class="custom-field"><label>Protein (g)</label><input class="inp" id="cf-p" type="number" min="0" step="0.1" value="0"></div>' +
            '<div class="custom-field"><label>Carbs (g)</label><input class="inp" id="cf-c" type="number" min="0" step="0.1" value="0"></div>' +
            '<div class="custom-field"><label>Fat (g)</label><input class="inp" id="cf-f" type="number" min="0" step="0.1" value="0"></div>' +
          '</div>' +
          '<button class="btn bp" id="cf-add-btn" style="width:100%;margin-top:10px">Save & Log</button>' +
          '<div id="cf-error" style="color:var(--rd);font-size:11px;margin-top:6px;display:none"></div>' +
        '</div>' +
      '</div>';

    // Toggle form
    el.querySelector("#custom-food-toggle").addEventListener("click", function() {
      var body    = el.querySelector("#custom-food-body");
      var chevron = el.querySelector(".custom-food-chevron");
      body.hidden = !body.hidden;
      chevron.textContent = body.hidden ? "▾" : "▴";
    });

    var listEl = el.querySelector("#nut-list-custom");

    function refreshMyFoods() {
      var foods = getCustomFoods();
      listEl._onLog = onLog;
      listEl._onFav = function(){};
      renderList(listEl, foods, "No custom foods yet — create one below.", refreshMyFoods);
    }
    refreshMyFoods();

    // Save & Log
    el.querySelector("#cf-add-btn").addEventListener("click", function() {
      var name   = (el.querySelector("#cf-name").value || "").trim();
      var srvLbl = (el.querySelector("#cf-serving").value || "").trim();
      var grams  = parseFloat(el.querySelector("#cf-grams").value) || 100;
      var cal    = parseFloat(el.querySelector("#cf-cal").value)   || 0;
      var p      = parseFloat(el.querySelector("#cf-p").value)     || 0;
      var c      = parseFloat(el.querySelector("#cf-c").value)     || 0;
      var f      = parseFloat(el.querySelector("#cf-f").value)     || 0;
      var errEl  = el.querySelector("#cf-error");

      if (!name) { errEl.textContent = "Name is required."; errEl.style.display = "block"; return; }
      if (!cal)  { errEl.textContent = "Calories are required."; errEl.style.display = "block"; return; }
      errEl.style.display = "none";

      // Store macros per 100g for consistency with API foods
      var per100g = grams / 100;
      var food = {
        id:       "custom_" + Date.now().toString(16),
        source:   "Custom",
        foodName: name,
        brand:    null,
        per100:   {
          cal: +(cal / per100g).toFixed(1),
          p:   +(p   / per100g).toFixed(1),
          c:   +(c   / per100g).toFixed(1),
          f:   +(f   / per100g).toFixed(1)
        },
        serving:  srvLbl ? { label: srvLbl, grams: grams } : null,
        calories: Math.round(cal),
        protein:  +p.toFixed(1)
      };

      // Save to library
      addCustomFood(food);

      // Also log immediately
      var entry = {
        id:       Math.random().toString(16).slice(2) + Date.now().toString(16),
        name:     name + (srvLbl ? " (" + srvLbl + ")" : ""),
        source:   "Custom",
        apiId:    food.id,
        key:      null,
        grams:    Math.round(grams),
        servings: srvLbl ? 1 : 0,
        cal:      Math.round(cal),
        p:        +p.toFixed(1),
        c:        +c.toFixed(1),
        f:        +f.toFixed(1),
        at:       Date.now()
      };
      onLog(food, entry, grams);

      // Refresh the My Foods list
      refreshMyFoods();

      // Flash and reset form
      var btn = el.querySelector("#cf-add-btn");
      btn.textContent = "✓ Saved & Logged!";
      btn.style.background = "var(--gn, #22c55e)";
      setTimeout(function() {
        btn.textContent = "Save & Log";
        btn.style.background = "";
        el.querySelector("#cf-name").value    = "";
        el.querySelector("#cf-serving").value = "";
        el.querySelector("#cf-grams").value   = "100";
        el.querySelector("#cf-cal").value     = "";
        el.querySelector("#cf-p").value       = "0";
        el.querySelector("#cf-c").value       = "0";
        el.querySelector("#cf-f").value       = "0";
        // Collapse the form
        el.querySelector("#custom-food-body").hidden = true;
        el.querySelector(".custom-food-chevron").textContent = "▾";
      }, 1400);
    });

    return el;
  }

  // ── Main init ─────────────────────────────────────────────────────────────
  function initSearchFood(root, opts) {
    opts  = opts || {};
    var onLog   = opts.onFoodLog      || function(){};
    var onFavCb = opts.onFoodFavorite || function(){};

    injectStyles();

    root.innerHTML =
      '<div class="nutrition-search-screen">' +
        '<div class="nut-title-row">' +
          '<h3 class="nut-title">Search & Log Food</h3>' +
          '<span class="nut-subtitle">2M+ foods</span>' +
        '</div>' +
        '<div class="nut-search-wrap">' +
          '<span class="nut-search-icon">🔍</span>' +
          '<input class="nut-search-input inp" id="nut-search-input" type="search" placeholder="e.g. Big Mac, chicken breast…" autocomplete="off">' +
          '<div class="nut-spinner" id="nut-spinner" hidden></div>' +
        '</div>' +
        '<div class="nut-source-note">Results from USDA + Open Food Facts · tap g to switch to grams</div>' +
        '<div class="nut-sections">' +
          '<section class="nut-section" id="nut-sec-search" hidden>' +
            '<div class="nut-section-head">Search Results</div>' +
            '<div class="food-list" id="nut-list-search"></div>' +
          '</section>' +
          '<section class="nut-section" id="nut-sec-fav">' +
            '<div class="nut-section-head">⭐ Favorites</div>' +
            '<div class="food-list" id="nut-list-fav"></div>' +
          '</section>' +
          '<section class="nut-section" id="nut-sec-recent">' +
            '<div class="nut-section-head">🕒 Recent</div>' +
            '<div class="food-list" id="nut-list-recent"></div>' +
          '</section>' +
          '<section class="nut-section" id="nut-sec-custom"></section>' +
        '</div>' +
      '</div>';

    var searchInput = root.querySelector("#nut-search-input");
    var spinner     = root.querySelector("#nut-spinner");
    var secSearch   = root.querySelector("#nut-sec-search");
    var listSearch  = root.querySelector("#nut-list-search");
    var secFav      = root.querySelector("#nut-sec-fav");
    var listFav     = root.querySelector("#nut-list-fav");
    var secRecent   = root.querySelector("#nut-sec-recent");
    var listRecent  = root.querySelector("#nut-list-recent");
    var secCustom   = root.querySelector("#nut-sec-custom");

    listSearch._onLog = listFav._onLog = listRecent._onLog = onLog;
    listSearch._onFav = listFav._onFav = listRecent._onFav = onFavCb;

    secCustom.appendChild(buildCustomFoodSection(onLog, function(){}));

    function loadFavsAndRecent() {
      var favs   = getFavs(8);
      var recent = getRecent(8);
      secFav.hidden    = favs.length === 0;
      secRecent.hidden = recent.length === 0;
      renderList(listFav,    favs,   "No favorites yet — tap ☆ to star a food.");
      renderList(listRecent, recent, "No recent foods yet.");
    }

    var lastQuery = "";
    function runSearch(query) {
      var q = (query || "").trim();
      if (q === lastQuery) return;
      lastQuery = q;

      if (q.length < 2) {
        secSearch.hidden = true;
        secFav.hidden    = getFavs().length === 0;
        secRecent.hidden = getRecent().length === 0;
        return;
      }

      var api = window._IronLogFoodApi;
      if (!api) {
        listSearch.innerHTML = '<p class="nut-empty nut-error">Food API not loaded.</p>';
        secSearch.hidden = false;
        return;
      }

      secFav.hidden    = true;
      secRecent.hidden = true;
      secSearch.hidden = false;
      spinner.hidden   = false;
      listSearch.innerHTML = renderSkeleton(5);

      api.searchFood(q, 20).then(function(results) {
        if (q !== lastQuery) return;
        spinner.hidden = true;
        renderList(listSearch, results, 'No results for "' + q + '". Try a different spelling or create a custom food below.');
      }).catch(function() {
        spinner.hidden = true;
        listSearch.innerHTML = '<p class="nut-empty nut-error">Search failed. Check your connection.</p>';
      });
    }

    var debouncedSearch = debounce(runSearch, 260);
    searchInput.addEventListener("input", function(e) { debouncedSearch(e.target.value); });
    searchInput.addEventListener("search", function(e) {
      if (!e.target.value) {
        lastQuery = "";
        secSearch.hidden = true;
        secFav.hidden    = getFavs().length === 0;
        secRecent.hidden = getRecent().length === 0;
      }
    });

    loadFavsAndRecent();
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  var _stylesInjected = false;
  function injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    var css = [
      ".nutrition-search-screen{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif}",
      ".nut-title-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}",
      ".nut-title{font-size:18px;font-weight:900;margin:0}",
      ".nut-subtitle{font-size:10px;color:var(--mt)}",
      ".nut-search-wrap{position:relative;display:flex;align-items:center;background:var(--c2);border:1px solid var(--c3);border-radius:14px;padding:0 14px;height:48px;margin-bottom:6px;transition:border-color .18s}",
      ".nut-search-wrap:focus-within{border-color:var(--bl);box-shadow:0 0 0 3px rgba(59,130,246,.18)}",
      ".nut-search-icon{font-size:16px;margin-right:8px;flex-shrink:0}",
      ".nut-search-input{flex:1;border:none;outline:none;background:transparent;color:var(--tx);font-size:15px;font-weight:500;min-width:0}",
      ".nut-spinner{width:18px;height:18px;border:2.5px solid var(--c3);border-top-color:var(--bl);border-radius:50%;animation:nutSpin .7s linear infinite;flex-shrink:0}",
      "@keyframes nutSpin{to{transform:rotate(360deg)}}",
      ".nut-source-note{font-size:10px;color:var(--mt);margin-bottom:12px}",
      ".nut-sections{display:grid;gap:14px}",
      ".nut-section[hidden]{display:none}",
      ".nut-section-head{font-size:11px;font-weight:800;color:var(--mt);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}",
      ".food-list{display:grid;gap:8px}",
      ".nut-empty{font-size:11px;color:var(--mt);border:1px dashed var(--c3);border-radius:12px;padding:14px;text-align:center}",
      ".nut-error{color:var(--rd)}",
      ".food-result-card{background:var(--c1);border:1px solid var(--c2);border-radius:14px;padding:12px;transition:border-color .15s,box-shadow .15s,opacity .2s,transform .2s;animation:cardIn .18s ease both}",
      ".food-result-card:hover{border-color:var(--bl)}",
      "@keyframes cardIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}",
      ".food-result-card.logged-flash{border-color:var(--gn);box-shadow:0 0 0 2px rgba(34,197,94,.25);transition:none}",
      ".food-card-top{display:flex;align-items:flex-start;gap:10px}",
      ".food-thumb{width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;background:var(--c2)}",
      ".food-card-info{flex:1;min-width:0}",
      ".food-card-name{font-size:13px;font-weight:800;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".food-card-brand{font-size:10px;color:var(--mt);margin-top:1px}",
      ".food-card-badges{margin:4px 0 3px}",
      ".source-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:999px;display:inline-block}",
      ".source-badge.usda{background:rgba(34,197,94,.15);color:#4ade80}",
      ".source-badge.off{background:rgba(59,130,246,.15);color:#60a5fa}",
      ".source-badge.local{background:rgba(168,85,247,.15);color:#c084fc}",
      ".food-card-macros{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:2px;align-items:center;font-size:10px;color:var(--mt)}",
      ".macro-chip{font-size:10px;font-weight:600;padding:2px 7px;border-radius:999px;background:var(--c2);color:var(--chip,var(--tx))}",
      ".food-card-serving{font-size:10px;color:var(--mt);font-weight:600}",
      ".fav-btn{font-size:20px;background:none;border:none;padding:2px 4px;flex-shrink:0;line-height:1;opacity:.55;transition:opacity .15s,transform .15s;cursor:pointer}",
      ".fav-btn:hover,.fav-btn.on{opacity:1}",
      ".fav-btn:active{transform:scale(1.3)}",
      ".custom-delete-btn{font-size:15px;background:none;border:none;padding:2px 4px;flex-shrink:0;opacity:.35;cursor:pointer;transition:opacity .15s}",
      ".custom-delete-btn:hover{opacity:1}",
      ".food-log-row{display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--c2)}",
      ".log-amount-wrap{display:flex;align-items:center;gap:4px;background:var(--c2);border-radius:10px;padding:0 8px;flex-shrink:0}",
      ".log-servings,.log-grams{width:54px;height:34px;background:transparent;border:none;color:var(--tx);font-size:13px;font-weight:700;text-align:center;outline:none}",
      ".grams-label{font-size:11px;color:var(--mt);font-weight:600;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".gram-toggle-btn{font-size:10px;font-weight:800;padding:4px 8px;border-radius:8px;background:var(--c3);border:none;color:var(--mt);cursor:pointer;flex-shrink:0}",
      ".gram-toggle-btn:hover{color:var(--tx)}",
      ".log-macros-preview{flex:1;min-width:0;font-size:10px;color:var(--mt);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".log-confirm-btn{padding:8px 14px;font-size:12px;flex-shrink:0}",
      ".food-result-card.skeleton{pointer-events:none}",
      ".sk-line{border-radius:6px;background:linear-gradient(90deg,var(--c2) 25%,var(--c3) 50%,var(--c2) 75%);background-size:200% 100%;animation:skShimmer 1.2s linear infinite}",
      "@keyframes skShimmer{to{background-position:-200% 0}}",
      ".custom-food-section{}",
      ".custom-food-form{background:var(--c1);border:1px solid var(--c2);border-radius:14px;overflow:hidden;margin-top:0}",
      ".custom-food-header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;font-size:13px;font-weight:800;cursor:pointer;user-select:none}",
      ".custom-food-header:hover{background:var(--c2)}",
      ".custom-food-chevron{font-size:16px;color:var(--mt)}",
      ".custom-food-body{padding:0 14px 14px}",
      ".custom-food-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
      ".cf-full{grid-column:span 2}",
      ".custom-field{display:flex;flex-direction:column;gap:3px}",
      ".custom-field label{font-size:10px;font-weight:700;color:var(--mt);text-transform:uppercase;letter-spacing:.05em}",
      ".custom-field .inp{padding:8px 10px;font-size:13px}"
    ].join("\n");
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  window._IronLogSearchFood = { initSearchFood: initSearchFood };
  console.log("[Iron Log] Search food UI ready.");
})();
