(function(){
  var easings = {
    smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  };

  function animateInStagger(selector, delayStep){
    var nodes = document.querySelectorAll(selector);
    nodes.forEach(function(node, i){
      node.style.animationDelay = (i * (delayStep || 50)) + 'ms';
      node.classList.add('stagger-in');
    });
  }

  function addPressFeedback(selector){
    document.querySelectorAll(selector).forEach(function(el){
      el.addEventListener('pointerdown', function(){ el.classList.add('is-pressed'); });
      ['pointerup','pointercancel','pointerleave'].forEach(function(evt){
        el.addEventListener(evt, function(){ el.classList.remove('is-pressed'); });
      });
    });
  }

  function pulseValue(el){
    if (!el) return;
    el.classList.remove('value-pulse');
    el.offsetWidth;
    el.classList.add('value-pulse');
  }

  window.IronLogAnimations = {
    easings: easings,
    animateInStagger: animateInStagger,
    addPressFeedback: addPressFeedback,
    pulseValue: pulseValue
  };
})();
