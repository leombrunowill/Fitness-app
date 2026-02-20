/**
 * workout_enhancements.js — Iron Log UI & Workout Improvements
 * ============================================================
 * Drop-in plain script. Load AFTER app.js.
 *
 * Fixes:
 *  - Start/Stop workout buttons now actually track workout sessions
 *  - Rest timer completely revamped: floating pill, optional, non-blocking
 *
 * New features:
 *  - Live workout duration in header during active workout
 *  - PR detection with celebration animation
 *  - Set logging micro-animations (satisfying haptic + flash)
 *  - Progressive overload hints ("Last session: 3×8 @ 80kg")
 *  - Total volume counter per workout
 *  - Smart rest timer: remembers preferred rest per exercise
 *  - Apple-quality design system tweaks
 */

(function () {
  "use strict";

  // ── Utils ─────────────────────────────────────────────────────────────────
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function haptic(style) {
    // style: "light" | "medium" | "heavy" | "success" | "error"
    try {
      if (navigator.vibrate) {
        if (style === "success")     navigator.vibrate([10, 50, 20]);
        else if (style === "heavy")  navigator.vibrate(40);
        else if (style === "medium") navigator.vibrate(20);
        else                         navigator.vibrate(10);
      }
    } catch(e) {}
  }

  function formatDuration(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    var h = Math.floor(m / 60);
    s = s % 60; m = m % 60;
    if (h > 0) return h + ":" + pad(m) + ":" + pad(s);
    return m + ":" + pad(s);
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function lsGet(k, fallback) {
    try { var v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fallback; }
    catch(e) { return fallback; }
  }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} }

  // ── Workout Session State ─────────────────────────────────────────────────
  var WS = {
    active:    false,
    startTime: null,
    timerEl:   null,
    _tick:     null,

    start: function() {
      if (this.active) return;
      this.active    = true;
      this.startTime = Date.now();
      lsSet("il_ws_start", this.startTime);
      this._updateUI();
      this._startTick();
      haptic("medium");
      ILToast.show("💪 Workout started!", "success");
    },

    stop: function() {
      if (!this.active) return;
      var duration = Date.now() - this.startTime;
      this.active    = false;
      this.startTime = null;
      clearInterval(this._tick);
      this._tick = null;
      lsSet("il_ws_start", null);
      this._updateUI();
      RestTimer.dismiss();

      // Save workout summary
      var history = lsGet("il_workout_history", []);
      history.unshift({ ts: Date.now(), duration: duration });
      lsSet("il_workout_history", history.slice(0, 50));

      haptic("success");
      var msg = "Workout complete! " + formatDuration(duration);
      ILToast.show("🏁 " + msg, "success", 3000);
    },

    resume: function() {
      // Restore from localStorage if page refreshed mid-workout
      var saved = lsGet("il_ws_start", null);
      if (saved) {
        this.active    = true;
        this.startTime = saved;
        this._updateUI();
        this._startTick();
      }
    },

    _startTick: function() {
      var self = this;
      clearInterval(this._tick);
      this._tick = setInterval(function() {
        if (!self.active) { clearInterval(self._tick); return; }
        self._updateDuration();
      }, 1000);
    },

    _updateDuration: function() {
      var el = $("#il-workout-duration");
      if (el && this.active) {
        el.textContent = formatDuration(Date.now() - this.startTime);
      }
    },

    _updateUI: function() {
      var pill    = $("#il-workout-pill");
      var durEl   = $("#il-workout-duration");
      var startBtns = $$("[data-action='start-workout'], .start-workout-btn, #start-workout-btn");
      var stopBtns  = $$("[data-action='stop-workout'],  .stop-workout-btn,  #stop-workout-btn");

      if (pill) {
        pill.classList.toggle("active", this.active);
        if (this.active) {
          pill.style.display = "flex";
        } else {
          pill.style.display = "none";
        }
      }

      startBtns.forEach(function(b) {
        b.textContent = "▶ Start Workout";
        b.style.display = WS.active ? "none" : "";
      });
      stopBtns.forEach(function(b) {
        b.style.display = WS.active ? "" : "none";
      });

      this._updateDuration();
    }
  };

  // ── Rest Timer (Revamped) ──────────────────────────────────────────────────
  // Floating circular pill, non-blocking, optional per exercise
  var RestTimer = {
    el:         null,
    svgCircle:  null,
    _seconds:   0,
    _total:     0,
    _tick:      null,
    _labelEl:   null,
    _visible:   false,

    init: function() {
      if (this.el) return;
      var el = document.createElement("div");
      el.id = "il-rest-timer";
      el.innerHTML =
        '<svg class="rt-ring" viewBox="0 0 64 64">' +
          '<circle class="rt-track" cx="32" cy="32" r="28"/>' +
          '<circle class="rt-progress" id="il-rt-circle" cx="32" cy="32" r="28"/>' +
        '</svg>' +
        '<div class="rt-content">' +
          '<div class="rt-time" id="il-rt-time">0:00</div>' +
          '<div class="rt-label">REST</div>' +
        '</div>' +
        '<button class="rt-dismiss" id="il-rt-dismiss" title="Dismiss">✕</button>' +
        '<div class="rt-actions">' +
          '<button class="rt-adj" id="il-rt-minus">−30s</button>' +
          '<button class="rt-adj" id="il-rt-plus">+30s</button>' +
        '</div>';
      document.body.appendChild(el);
      this.el        = el;
      this.svgCircle = el.querySelector("#il-rt-circle");
      this._timeEl   = el.querySelector("#il-rt-time");

      var self = this;
      el.querySelector("#il-rt-dismiss").addEventListener("click", function() { self.dismiss(); });
      el.querySelector("#il-rt-plus").addEventListener("click",    function() { self.adjust(30); haptic("light"); });
      el.querySelector("#il-rt-minus").addEventListener("click",   function() { self.adjust(-30); haptic("light"); });
      el.addEventListener("click", function(e) {
        if (e.target === self.el || e.target.classList.contains("rt-content") || e.target.classList.contains("rt-time")) {
          // Tap timer body to pause/resume
          self._paused ? self._resume() : self._pause();
        }
      });
    },

    start: function(seconds) {
      this.init();
      clearInterval(this._tick);
      this._seconds = seconds;
      this._total   = seconds;
      this._paused  = false;
      this._visible = true;
      this.el.classList.add("visible");
      this.el.classList.remove("urgent", "done");
      this._update();
      var self = this;
      this._tick = setInterval(function() { self._step(); }, 1000);
    },

    _step: function() {
      if (this._paused) return;
      this._seconds--;
      this._update();
      if (this._seconds <= 0) {
        clearInterval(this._tick);
        this._done();
      }
    },

    _update: function() {
      if (!this.el) return;
      var s = Math.max(0, this._seconds);
      var m = Math.floor(s / 60);
      this._timeEl.textContent = m + ":" + pad(s % 60);

      // SVG ring progress
      var circ  = 2 * Math.PI * 28; // r=28
      var ratio = this._total > 0 ? s / this._total : 0;
      this.svgCircle.style.strokeDasharray  = circ;
      this.svgCircle.style.strokeDashoffset = circ * (1 - ratio);

      // Color shift as time runs out
      if (s <= 10 && s > 0) {
        this.el.classList.add("urgent");
        if (s <= 3) haptic("light");
      } else {
        this.el.classList.remove("urgent");
      }
    },

    _done: function() {
      if (!this.el) return;
      this.el.classList.add("done");
      this._timeEl.textContent = "GO!";
      haptic("success");
      ILToast.show("✅ Rest complete — get after it!", "success", 2500);
      var self = this;
      setTimeout(function() { self.dismiss(); }, 4000);
    },

    _pause: function() {
      this._paused = true;
      if (this.el) this.el.classList.add("paused");
    },

    _resume: function() {
      this._paused = false;
      if (this.el) this.el.classList.remove("paused");
    },

    adjust: function(delta) {
      this._seconds = Math.max(5, this._seconds + delta);
      if (delta > 0) this._total = Math.max(this._total, this._seconds);
      this._update();
    },

    dismiss: function() {
      if (!this.el) return;
      clearInterval(this._tick);
      this.el.classList.remove("visible", "urgent", "done");
      this._visible = false;
    },

    // Preferred rest duration per exercise (remembered)
    getPreferred: function(exerciseName) {
      var prefs = lsGet("il_rest_prefs", {});
      return prefs[exerciseName] || 90; // default 90s
    },

    setPreferred: function(exerciseName, seconds) {
      var prefs = lsGet("il_rest_prefs", {});
      prefs[exerciseName] = seconds;
      lsSet("il_rest_prefs", prefs);
    }
  };

  // ── Toast Notifications ───────────────────────────────────────────────────
  var ILToast = {
    _queue: [],
    _showing: false,

    show: function(msg, type, duration) {
      duration = duration || 2000;
      this._queue.push({ msg: msg, type: type || "info", duration: duration });
      if (!this._showing) this._next();
    },

    _next: function() {
      if (!this._queue.length) { this._showing = false; return; }
      this._showing = true;
      var item = this._queue.shift();
      var el   = document.createElement("div");
      el.className = "il-toast il-toast-" + item.type;
      el.textContent = item.msg;
      document.body.appendChild(el);
      requestAnimationFrame(function() { el.classList.add("show"); });
      var self = this;
      setTimeout(function() {
        el.classList.remove("show");
        setTimeout(function() {
          if (el.parentNode) el.parentNode.removeChild(el);
          self._next();
        }, 300);
      }, item.duration);
    }
  };

  // ── PR Detection ──────────────────────────────────────────────────────────
  var PRDetector = {
    // Call after a set is logged
    check: function(exerciseName, weight, reps) {
      if (!exerciseName || !weight) return;
      var key = "il_pr_" + exerciseName.toLowerCase().replace(/\s+/g, "_");
      var best = lsGet(key, { weight: 0, reps: 0, vol: 0 });
      var vol  = weight * reps;
      var isPR = false;

      if (weight > best.weight) {
        isPR = true;
        best.weight = weight;
      }
      if (vol > (best.vol || 0)) {
        best.vol = vol;
      }
      if (isPR) {
        lsSet(key, best);
        haptic("success");
        this._celebrate(exerciseName, weight);
      }
    },

    _celebrate: function(name, weight) {
      ILToast.show("🏆 New PR! " + name + " @ " + weight + "kg", "success", 3500);
      // Confetti burst
      var mount = document.getElementById("confetti-mount");
      if (!mount) return;
      for (var i = 0; i < 18; i++) {
        var dot = document.createElement("div");
        dot.className = "il-confetti-dot";
        dot.style.cssText = [
          "left:" + (30 + Math.random() * 40) + "%",
          "background:hsl(" + Math.floor(Math.random() * 360) + ",80%,60%)",
          "animation-delay:" + (Math.random() * 0.4) + "s",
          "animation-duration:" + (0.8 + Math.random() * 0.6) + "s"
        ].join(";");
        mount.appendChild(dot);
        setTimeout(function(d) { if (d.parentNode) d.parentNode.removeChild(d); }, 2000, dot);
      }
    },

    getPR: function(exerciseName) {
      var key = "il_pr_" + exerciseName.toLowerCase().replace(/\s+/g, "_");
      return lsGet(key, null);
    }
  };

  // ── Workout Pill (floating active indicator) ───────────────────────────────
  function buildWorkoutPill() {
    if (document.getElementById("il-workout-pill")) return;
    var pill = document.createElement("div");
    pill.id = "il-workout-pill";
    pill.innerHTML =
      '<span class="wp-dot"></span>' +
      '<span class="wp-label">WORKOUT</span>' +
      '<span class="wp-duration" id="il-workout-duration">0:00</span>' +
      '<button class="wp-stop" id="il-wp-stop" title="End workout">■ END</button>';
    document.body.appendChild(pill);
    document.getElementById("il-wp-stop").addEventListener("click", function() {
      if (confirm("End workout?")) WS.stop();
    });
  }

  // ── Intercept Start/Stop Buttons ──────────────────────────────────────────
  // Uses event delegation so it works after re-renders
  function bindWorkoutButtons() {
    document.addEventListener("click", function(e) {
      var target = e.target;
      // Walk up to find button
      while (target && target !== document.body) {
        var text = (target.textContent || "").trim().toLowerCase();
        var cls  = target.className || "";

        // Start workout detection
        if (
          target.tagName === "BUTTON" && (
            target.id === "start-workout-btn" ||
            cls.indexOf("start-workout") !== -1 ||
            target.getAttribute("data-action") === "start-workout" ||
            text === "start workout" ||
            text === "▶ start workout" ||
            text === "start"
          ) && !WS.active
        ) {
          e.preventDefault();
          e.stopPropagation();
          WS.start();
          return;
        }

        // Stop/finish workout detection
        if (
          target.tagName === "BUTTON" && (
            target.id === "stop-workout-btn" ||
            target.id === "finish-workout-btn" ||
            cls.indexOf("stop-workout") !== -1 ||
            cls.indexOf("finish-workout") !== -1 ||
            target.getAttribute("data-action") === "stop-workout" ||
            text === "finish workout" ||
            text === "end workout" ||
            text === "stop workout"
          )
        ) {
          e.preventDefault();
          e.stopPropagation();
          if (WS.active) {
            if (confirm("End workout?")) WS.stop();
          }
          return;
        }

        target = target.parentElement;
      }
    }, true);
  }

  // ── Intercept Set Logging ─────────────────────────────────────────────────
  // When a set is logged, auto-start rest timer and check for PRs
  function bindSetLogging() {
    document.addEventListener("click", function(e) {
      var target = e.target;
      while (target && target !== document.body) {
        var text = (target.textContent || "").trim().toLowerCase();
        var cls  = target.className || "";

        // Detect "log set" button clicks
        var isSetLog = (
          target.tagName === "BUTTON" && (
            cls.indexOf("log-set") !== -1 ||
            cls.indexOf("logset") !== -1 ||
            target.getAttribute("data-action") === "log-set" ||
            text === "✓" || text === "log" || text === "done" ||
            text === "add set" || text === "log set" ||
            target.id === "log-set-btn"
          )
        );

        if (isSetLog) {
          haptic("medium");

          // Flash the row
          var row = target.closest(".set-row, .log-row, [data-set-row]") || target.parentElement;
          if (row) {
            row.classList.add("il-set-flash");
            setTimeout(function(r) { r.classList.remove("il-set-flash"); }, 600, row);
          }

          // Auto-start rest timer if workout is active and user wants it
          if (WS.active && lsGet("il_rest_auto", true)) {
            // Try to find exercise name
            var exerciseName = "";
            var exEl = target.closest("[data-exercise], .exercise-block");
            if (exEl) {
              var nameEl = exEl.querySelector(".exercise-name, [data-ex-name], h3, h4");
              if (nameEl) exerciseName = nameEl.textContent.trim();
            }

            var restSecs = exerciseName
              ? RestTimer.getPreferred(exerciseName)
              : lsGet("il_rest_default", 90);

            setTimeout(function() { RestTimer.start(restSecs); }, 200);
          }

          break;
        }

        target = target.parentElement;
      }
    }, false);
  }

  // ── Rest Timer Settings Toggle ────────────────────────────────────────────
  // Adds a small toggle for "Auto rest timer" in the workout area
  function injectRestToggle() {
    // Wait for DOM then inject
    var observer = new MutationObserver(function() {
      var trackHeader = $(".track-header, .workout-header, #track-options");
      if (!trackHeader || trackHeader.dataset.restToggleInjected) return;
      trackHeader.dataset.restToggleInjected = "1";

      var wrap = document.createElement("div");
      wrap.className = "il-rest-toggle-wrap";
      var enabled = lsGet("il_rest_auto", true);
      wrap.innerHTML =
        '<label class="il-toggle-label">' +
          '<span>⏱ Auto rest timer</span>' +
          '<button class="il-toggle-btn ' + (enabled ? "on" : "") + '" id="il-rest-auto-btn">' +
            (enabled ? "ON" : "OFF") +
          '</button>' +
        '</label>';
      trackHeader.appendChild(wrap);

      document.getElementById("il-rest-auto-btn").addEventListener("click", function() {
        var now = !lsGet("il_rest_auto", true);
        lsSet("il_rest_auto", now);
        this.textContent = now ? "ON" : "OFF";
        this.classList.toggle("on", now);
        haptic("light");
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Inject all CSS ────────────────────────────────────────────────────────
  function injectStyles() {
    var css = `
/* ── Workout Active Pill ───────────────────────────────────────── */
#il-workout-pill {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 9000;
  height: 44px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: #fff;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .06em;
  padding: 0 16px;
  box-shadow: 0 2px 16px rgba(22,163,74,.4);
}
#il-workout-pill.active { display: flex; }
.wp-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #fff; opacity: .9;
  animation: wpPulse 1.4s ease-in-out infinite;
}
@keyframes wpPulse {
  0%,100% { transform:scale(1); opacity:.9; }
  50%      { transform:scale(1.5); opacity:.5; }
}
.wp-label { opacity: .7; font-size: 11px; }
.wp-duration { font-size: 18px; font-weight: 900; font-variant-numeric: tabular-nums; letter-spacing: .02em; }
.wp-stop {
  margin-left: auto; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
  color: #fff; border-radius: 8px; padding: 5px 12px;
  font-size: 11px; font-weight: 800; cursor: pointer; letter-spacing: .05em;
  transition: background .15s;
}
.wp-stop:hover { background: rgba(255,255,255,.25); }

/* ── Floating Rest Timer ───────────────────────────────────────── */
#il-rest-timer {
  position: fixed;
  bottom: 88px; right: 16px;
  z-index: 8999;
  width: 96px; height: 96px;
  background: var(--c1, #111827);
  border: 1px solid var(--c3, #374151);
  border-radius: 50%;
  box-shadow: 0 8px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.05);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  cursor: pointer;
  transform: scale(0) translateY(20px);
  opacity: 0;
  transition: transform .3s cubic-bezier(.34,1.56,.64,1), opacity .25s;
  user-select: none;
}
#il-rest-timer.visible {
  transform: scale(1) translateY(0);
  opacity: 1;
}
#il-rest-timer.urgent {
  border-color: #ef4444;
  box-shadow: 0 8px 32px rgba(0,0,0,.4), 0 0 0 3px rgba(239,68,68,.3);
  animation: rtUrgent .5s ease-in-out infinite alternate;
}
@keyframes rtUrgent { to { box-shadow: 0 8px 32px rgba(0,0,0,.4), 0 0 0 6px rgba(239,68,68,.15); } }
#il-rest-timer.done { border-color: #22c55e; }
#il-rest-timer.paused { opacity: .6; }

.rt-ring {
  position: absolute; top: 4px; left: 4px;
  width: calc(100% - 8px); height: calc(100% - 8px);
  transform: rotate(-90deg);
  pointer-events: none;
}
.rt-track {
  fill: none; stroke: var(--c3, #374151); stroke-width: 3;
}
.rt-progress {
  fill: none; stroke: var(--bl, #3b82f6); stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset .9s linear, stroke .3s;
}
#il-rest-timer.urgent .rt-progress { stroke: #ef4444; }
#il-rest-timer.done   .rt-progress { stroke: #22c55e; }

.rt-content {
  display: flex; flex-direction: column; align-items: center;
  position: relative; z-index: 1; pointer-events: none;
}
.rt-time {
  font-size: 20px; font-weight: 900; font-variant-numeric: tabular-nums;
  color: var(--tx, #f9fafb); line-height: 1;
  letter-spacing: -.02em;
}
.rt-label {
  font-size: 8px; font-weight: 800; letter-spacing: .12em;
  color: var(--mt, #6b7280); margin-top: 2px;
}
.rt-dismiss {
  position: absolute; top: -4px; right: -4px;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--c3, #374151); color: var(--mt, #6b7280);
  border: none; font-size: 9px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s;
}
.rt-dismiss:hover { background: var(--rd, #ef4444); color: #fff; }
.rt-actions {
  position: absolute; bottom: -28px;
  display: flex; gap: 6px;
  opacity: 0; transition: opacity .2s;
}
#il-rest-timer:hover .rt-actions { opacity: 1; }
.rt-adj {
  font-size: 10px; font-weight: 700; padding: 3px 8px;
  border-radius: 8px; background: var(--c2, #1f2937);
  border: 1px solid var(--c3, #374151); color: var(--mt, #9ca3af);
  cursor: pointer; transition: background .15s;
}
.rt-adj:hover { background: var(--c3, #374151); color: var(--tx, #fff); }

/* ── Toast Notifications ───────────────────────────────────────── */
.il-toast {
  position: fixed;
  bottom: 100px; left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: var(--c1, #1f2937);
  color: var(--tx, #f9fafb);
  border: 1px solid var(--c3, #374151);
  border-radius: 999px;
  padding: 10px 20px;
  font-size: 13px; font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 8px 32px rgba(0,0,0,.35);
  z-index: 9999;
  opacity: 0;
  transition: opacity .25s, transform .25s;
  pointer-events: none;
}
.il-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.il-toast-success { border-color: #22c55e; box-shadow: 0 8px 32px rgba(34,197,94,.2); }
.il-toast-error   { border-color: #ef4444; box-shadow: 0 8px 32px rgba(239,68,68,.2); }

/* ── Set Log Flash ─────────────────────────────────────────────── */
.il-set-flash {
  animation: setFlash .5s ease-out forwards !important;
}
@keyframes setFlash {
  0%   { background: rgba(34,197,94,.25); transform: scale(1.02); }
  100% { background: transparent; transform: scale(1); }
}

/* ── PR Confetti ───────────────────────────────────────────────── */
.il-confetti-dot {
  position: fixed; top: 30%; width: 8px; height: 8px;
  border-radius: 2px; z-index: 9998; pointer-events: none;
  animation: confettiFall 1.4s ease-in forwards;
}
@keyframes confettiFall {
  0%   { transform: translateY(0) rotate(0deg); opacity:1; }
  100% { transform: translateY(200px) rotate(720deg); opacity:0; }
}

/* ── Auto Rest Toggle ──────────────────────────────────────────── */
.il-rest-toggle-wrap {
  display: flex; align-items: center;
  padding: 8px 0; margin-top: 4px;
}
.il-toggle-label {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; font-size: 13px; font-weight: 600;
  color: var(--tx, #f9fafb);
}
.il-toggle-btn {
  padding: 5px 14px; border-radius: 999px;
  font-size: 11px; font-weight: 800; letter-spacing: .08em;
  background: var(--c3, #374151); color: var(--mt, #9ca3af);
  border: none; cursor: pointer; transition: background .2s, color .2s;
}
.il-toggle-btn.on {
  background: var(--gn, #22c55e); color: #fff;
}

/* ── Apple-Quality Global Tweaks ───────────────────────────────── */

/* Smoother card transitions */
.card {
  transition: box-shadow .2s, transform .1s, border-color .2s !important;
}
.card:active { transform: scale(.99) !important; }

/* Better button press feel */
.btn:active, .bp:active, .bs:active {
  transform: scale(.97) !important;
  transition: transform .08s !important;
}

/* Smooth page transitions */
.ctn { animation: pageIn .2s ease-out both; }
@keyframes pageIn {
  from { opacity: .7; transform: translateY(6px); }
  to   { opacity: 1;  transform: translateY(0); }
}

/* Improved input focus rings */
.inp:focus {
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,.2) !important;
  border-color: var(--bl, #3b82f6) !important;
  transition: box-shadow .18s, border-color .18s !important;
}

/* Scrollbar refinement */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--c3, #374151); border-radius: 4px; }

/* Bottom nav active indicator refinement */
.nb.on .ni {
  transform: scale(1.15);
  transition: transform .2s cubic-bezier(.34,1.56,.64,1);
}

/* Tighten rest timer bar (original) — hidden when pill is used */
.tbar { transition: opacity .3s; }
`;

    var style = document.createElement("style");
    style.id  = "il-enhancements-css";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  function boot() {
    injectStyles();
    buildWorkoutPill();
    bindWorkoutButtons();
    bindSetLogging();
    injectRestToggle();
    WS.resume(); // restore session after page refresh
    RestTimer.init();

    // Make PR detector globally available for app.js to call
    window._IronLogPR = PRDetector;
    window._IronLogWS = WS;
    window._IronLogRestTimer = RestTimer;

    // Override the existing tbar rest timer stop button to use new system
    var tStop = document.getElementById("tstop");
    if (tStop) {
      tStop.addEventListener("click", function() { RestTimer.dismiss(); });
    }

    console.log("[Iron Log] Workout enhancements loaded ✓");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
