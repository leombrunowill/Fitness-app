(function(){
  var durations = {
    fast: 120,
    base: 180,
    slow: 280
  };

  var motion = {
    fadeIn: { duration: durations.base, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
    scaleIn: { duration: durations.fast, keyframes: [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'scale(1)' }] },
    slideUp: { duration: durations.slow, keyframes: [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }] },
    numberTicker: { duration: durations.slow }
  };

  function animateToken(el, token){
    if (!el || !motion[token] || !el.animate) return;
    el.animate(motion[token].keyframes, { duration: motion[token].duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' });
  }

  function animateInStagger(selector, delayStep){
    var nodes = document.querySelectorAll(selector);
    nodes.forEach(function(node, i){
      setTimeout(function(){ animateToken(node, 'slideUp'); }, i * (delayStep || 50));
    });
  }

  function addPressFeedback(selector){
    document.querySelectorAll(selector).forEach(function(el){
      el.addEventListener('pointerdown', function(){ el.style.transform = 'scale(.98)'; });
      ['pointerup','pointercancel','pointerleave'].forEach(function(evt){
        el.addEventListener(evt, function(){ el.style.transform = ''; });
      });
    });
  }

  function pulseValue(el){
    animateToken(el, 'scaleIn');
  }

  function numberTicker(el, next){
    if (!el) return;
    var start = Number(el.textContent) || 0;
    var end = Number(next) || 0;
    var startTs = performance.now();
    function frame(ts){
      var p = Math.min(1, (ts - startTs) / motion.numberTicker.duration);
      el.textContent = String(Math.round(start + (end - start) * p));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  window.IronLogAnimations = {
    durations: durations,
    fadeIn: motion.fadeIn,
    scaleIn: motion.scaleIn,
    slideUp: motion.slideUp,
    numberTicker: motion.numberTicker,
    animateToken: animateToken,
    animateInStagger: animateInStagger,
    addPressFeedback: addPressFeedback,
    pulseValue: pulseValue,
    runNumberTicker: numberTicker
  };
})();
