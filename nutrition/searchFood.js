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

  function servingLabel(food) {
    if (food.serving) {
      return "1 srv (" + food.serving.grams + "g) = " +
             Math.round((food.per100.cal || 0) * food.serving.grams / 100) + " cal";
    }
    return "100g = " + (food.calories || 0) + " cal";
  }

  // Simple in-memory favorites (no Supabase dependency)
  var _favs = {};
  try { _favs = JSON.parse(localStorage.getItem("il_food_favs") || "{}"); } catch(e){}
  function isFav(food) { return !!_favs[food.id]; }
  function toggleFav(food) {
    if (_favs[food.id]) { delete _favs[food.id]; } else { _favs[food.id] = food; }
    try { localStorage.setItem("il_food_favs", JSON.stringify(_favs)); } catch(e){}
    return !!_favs[food.id];
  }
  function getFavs(limit) {
    return Object.values(_favs).slice(0, limit || 8);
  }

  var _recent = [];
  try { _recent = JSON.parse(localStorage.getItem("il_food_recent") || "[]"); } catch(e){}
  function recordRecent(food) {
    _recent = _recent.filter(function(f){ return f.id !== food.id; });
    _recent.unshift(food);
    _recent = _recent.slice(0, 10);
    try { localStorage.setItem("il_food_recent", JSON.stringify(_recent)); } catch(e){}
  }
  function getRecent(limit) { return _recent.slice(0, limit || 8); }

  function buildFoodCard(food, onLog, onFavToggle) {
    var fav   = isFav(food);
    var p100  = food.per100 || {};
    var name  = food.foodName || "Unknown";
    var brand = food.brand || "";
    var img   = food.image || "";
    var defaultG = food.serving ? food.serving.grams : 100;

    var el = document.createElement("div");
    el.className = "food-result-card";
    el.setAttribute("data-food-id", food.id || "");

    el.innerHTML =
      '<div class="food-card-top">' +
        (img ? '<img class="food-thumb" src="' + esc(img) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '') +
        '<div class="food-card-info">' +
          '<div class="food-card-name">' + esc(name) + '</div>' +
          (brand ? '<div class="food-card-brand">' + esc(brand) + '</div>' : '') +
          '<div class="food-card-badges">' + sourceBadge(food.source) + '</div>' +
          '<div class="food-card-macros">' +
            macroChip("Cal", Math.round(p100.cal || 0), "#f59e0b") +
            macroChip("P",   (p100.p || 0) + "g", "#60a5fa") +
            macroChip("C",   (p100.c || 0) + "g", "#34d399") +
            macroChip("F",   (p100.f || 0) + "g", "#f472b6") +
          '</div>' +
          '<div class="food-card-serving">' + esc(servingLabel(food)) + '</div>' +
        '</div>' +
        '<button class="fav-btn ' + (fav ? "on" : "") + '" aria-label="Toggle favorite" data-fav>' +
          (fav ? "⭐" : "☆") +
        '</button>' +
      '</div>' +
      '<div class="food-log-row">' +
        '<div class="log-amount-wrap">' +
          '<input class="inp log-grams" type="number" min="1" step="1" value="' + defaultG + '" placeholder="g">' +
          '<span class="grams-label">g</span>' +
        '</div>' +
        '<div class="log-macros-preview" data-preview></div>' +
        '<button class="btn bp log-confirm-btn" data-log>Add</button>' +
      '</div>';

    // Live macro preview
    var gramsEl   = el.querySelector(".log-grams");
    var previewEl = el.querySelector("[data-preview]");
    function updatePreview() {
      var g = parseFloat(gramsEl.value) || defaultG;
      var r = g / 100;
      previewEl.textContent =
        Math.round((p100.cal || 0) * r) + " cal · " +
        ((p100.p  || 0) * r).toFixed(1) + "p · " +
        ((p100.c  || 0) * r).toFixed(1) + "c · " +
        ((p100.f  || 0) * r).toFixed(1) + "f";
    }
    updatePreview();
    gramsEl.addEventListener("input", updatePreview);

    // Add button
    el.querySelector("[data-log]").addEventListener("click", function() {
      var g = parseFloat(gramsEl.value) || defaultG;
      var api = window._IronLogFoodApi;
      if (!api) return;
      var entry = api.apiItemToLogEntry(food, g);
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

    return el;
  }

  function renderList(listEl, foods, emptyMsg) {
    listEl.innerHTML = "";
    if (!foods || !foods.length) {
      listEl.innerHTML = '<p class="nut-empty">' + esc(emptyMsg) + '</p>';
      return;
    }
    foods.forEach(function(food) {
      listEl.appendChild(buildFoodCard(food, listEl._onLog, listEl._onFav));
    });
  }

  function initSearchFood(root, opts) {
    opts = opts || {};
    var onLog = opts.onFoodLog || function(){};
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
          '<input class="nut-search-input inp" id="nut-search-input" type="search" placeholder="e.g. chicken breast, oats…" autocomplete="off">' +
          '<div class="nut-spinner" id="nut-spinner" hidden></div>' +
        '</div>' +
        '<div class="nut-source-note">Results from USDA + Open Food Facts</div>' +
        '<div class="nut-sections">' +
          '<section class="nut-section" id="nut-sec-search" hidden>' +
            '<div class="nut-section-head" id="nut-search-head" hidden>Search Results</div>' +
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
        '</div>' +
      '</div>';

    var searchInput = root.querySelector("#nut-search-input");
    var spinner     = root.querySelector("#nut-spinner");
    var secSearch   = root.querySelector("#nut-sec-search");
    var searchHead  = root.querySelector("#nut-search-head");
    var listSearch  = root.querySelector("#nut-list-search");
    var secFav      = root.querySelector("#nut-sec-fav");
    var listFav     = root.querySelector("#nut-list-fav");
    var secRecent   = root.querySelector("#nut-sec-recent");
    var listRecent  = root.querySelector("#nut-list-recent");

    // Attach callbacks to list containers (accessed in renderList)
    listSearch._onLog = listFav._onLog = listRecent._onLog = onLog;
    listSearch._onFav = listFav._onFav = listRecent._onFav = onFavCb;

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
        listSearch.innerHTML = '<p class="nut-empty nut-error">Food API not loaded. Check console.</p>';
        secSearch.hidden = false;
        return;
      }

      secFav.hidden    = true;
      secRecent.hidden = true;
      secSearch.hidden = false;
      searchHead.hidden = false;
      spinner.hidden   = false;
      listSearch.innerHTML = renderSkeleton(5);

      api.searchFood(q, 20).then(function(results) {
        if (q !== lastQuery) return; // stale result
        spinner.hidden = true;
        renderList(listSearch, results, 'No results for "' + q + '". Try a different spelling.');
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
        searchHead.hidden = true;
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
      ".food-result-card{background:var(--c1);border:1px solid var(--c2);border-radius:14px;padding:12px;transition:border-color .15s,box-shadow .15s;animation:cardIn .18s ease both}",
      ".food-result-card:hover{border-color:var(--bl)}",
      "@keyframes cardIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}",
      ".food-result-card.logged-flash{border-color:var(--gn);box-shadow:0 0 0 2px rgba(34,197,94,.25);transition:none}",
      ".food-card-top{display:flex;align-items:flex-start;gap:10px}",
      ".food-thumb{width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;background:var(--c2)}",
      ".food-card-info{flex:1;min-width:0}",
      ".food-card-name{font-size:13px;font-weight:800;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".food-card-brand{font-size:10px;color:var(--mt);margin-top:1px}",
      ".food-card-badges{margin:4px 0 5px}",
      ".source-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:999px;display:inline-block}",
      ".source-badge.usda{background:rgba(34,197,94,.15);color:#4ade80}",
      ".source-badge.off{background:rgba(59,130,246,.15);color:#60a5fa}",
      ".source-badge.local{background:rgba(168,85,247,.15);color:#c084fc}",
      ".food-card-macros{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px}",
      ".macro-chip{font-size:10px;font-weight:600;padding:2px 7px;border-radius:999px;background:var(--c2);color:var(--chip,var(--tx))}",
      ".food-card-serving{font-size:10px;color:var(--mt)}",
      ".fav-btn{font-size:20px;background:none;border:none;padding:2px 4px;flex-shrink:0;line-height:1;opacity:.55;transition:opacity .15s,transform .15s;cursor:pointer}",
      ".fav-btn:hover,.fav-btn.on{opacity:1}",
      ".fav-btn:active{transform:scale(1.3)}",
      ".food-log-row{display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--c2)}",
      ".log-amount-wrap{display:flex;align-items:center;gap:4px;background:var(--c2);border-radius:10px;padding:0 8px;flex-shrink:0}",
      ".log-grams{width:58px;height:34px;background:transparent;border:none;color:var(--tx);font-size:13px;font-weight:700;text-align:center;outline:none}",
      ".grams-label{font-size:11px;color:var(--mt);font-weight:600}",
      ".log-macros-preview{flex:1;min-width:0;font-size:10px;color:var(--mt);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".log-confirm-btn{padding:8px 14px;font-size:12px;flex-shrink:0}",
      ".food-result-card.skeleton{pointer-events:none}",
      ".sk-line{border-radius:6px;background:linear-gradient(90deg,var(--c2) 25%,var(--c3) 50%,var(--c2) 75%);background-size:200% 100%;animation:skShimmer 1.2s linear infinite}",
      "@keyframes skShimmer{to{background-position:-200% 0}}"
    ].join("\n");
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  window._IronLogSearchFood = { initSearchFood: initSearchFood };
  console.log("[Iron Log] Search food UI ready.");
})();
