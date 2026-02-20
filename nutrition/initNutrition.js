/**
 * nutrition/initNutrition.js — plain script (no ES modules)
 * Auto-initializes the food search UI into #api-search-root
 * Requires: foodApi.js and searchFood.js loaded first.
 */
(function () {
  "use strict";

  function initNutrition() {
    var root = document.getElementById("api-search-root");
    if (!root) return;
    if (root.dataset.initialized) return;
    root.dataset.initialized = "1";

    var sf = window._IronLogSearchFood;
    if (!sf || !sf.initSearchFood) {
      console.warn("[Iron Log] searchFood.js not loaded yet");
      return;
    }

    sf.initSearchFood(root, {
      onFoodLog: function(apiFood, logEntry) {
        if (window._IronLogApp && window._IronLogApp.addFoodEntry) {
          window._IronLogApp.addFoodEntry(logEntry);
          return;
        }
        // Fallback: write directly to localStorage
        try {
          var selDate = localStorage.getItem("il_selDate") || new Date().toISOString().slice(0, 10);
          var nlog    = JSON.parse(localStorage.getItem("il_nlog") || "{}");
          if (!nlog[selDate]) nlog[selDate] = [];
          nlog[selDate].push(logEntry);
          localStorage.setItem("il_nlog", JSON.stringify(nlog));
          if (typeof window._ilRender === "function") window._ilRender();
        } catch (e) {
          console.error("Failed to save food entry:", e);
        }
      },
      onFoodFavorite: function() {}
    });
  }

  // Re-run after each render (app.js recreates the DOM each time)
  var _lastRoot = null;
  function checkAndInit() {
    var root = document.getElementById("api-search-root");
    if (root && root !== _lastRoot) {
      _lastRoot = root;
      root.dataset.initialized = "";  // reset so initNutrition runs fresh
      initNutrition();
    }
  }

  // Poll for the root element (simple and reliable with SPA-style renders)
  setInterval(checkAndInit, 300);

  // Also run on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNutrition);
  } else {
    initNutrition();
  }

  window._IronLogNutrition = { refresh: initNutrition };
  console.log("[Iron Log] Nutrition init ready.");
})();
