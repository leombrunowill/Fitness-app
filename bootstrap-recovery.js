(function () {
  "use strict";

  function clearIronLogStorage() {
    try {
      Object.keys(localStorage).forEach(function (key) {
        if (key.indexOf("il_") === 0) localStorage.removeItem(key);
      });
    } catch (e) {}
  }

  function mountRecoveryCard(reason) {
    var app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = '' +
      '<div class="card" style="margin-top:10px;border:1px solid var(--yl)">' +
      '<div style="font-size:14px;font-weight:900;margin-bottom:8px">Recovery Mode</div>' +
      '<div style="font-size:11px;color:var(--mt);margin-bottom:10px">' + reason + '</div>' +
      '<button class="btn bp" id="recovery-retry" style="width:100%;margin-bottom:8px">Retry App Render</button>' +
      '<button class="btn bs" id="recovery-reset" style="width:100%">Reset Local Data & Reload</button>' +
      '</div>';

    var retry = document.getElementById("recovery-retry");
    if (retry) retry.onclick = function () {
      try {
        if (typeof window._ilRender === "function") window._ilRender();
      } catch (e) {}
      setTimeout(function () {
        var html = (app.innerHTML || "").trim();
        if (!html || html.indexOf("Recovery Mode") >= 0) {
          mountRecoveryCard("Retry did not complete. A safe local reset is recommended.");
        }
      }, 300);
    };

    var reset = document.getElementById("recovery-reset");
    if (reset) reset.onclick = function () {
      clearIronLogStorage();
      location.reload();
    };
  }

  function ensureAppVisible() {
    var app = document.getElementById("app");
    if (!app) return;

    if (typeof window._ilRender === "function") {
      try { window._ilRender(); } catch (e) {}
    }

    setTimeout(function () {
      var html = (app.innerHTML || "").trim();
      if (!html) {
        mountRecoveryCard("The main app did not mount correctly. Recovery tools are available below.");
      }
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(ensureAppVisible, 1200);
    }, { once: true });
  } else {
    setTimeout(ensureAppVisible, 1200);
  }
})();
