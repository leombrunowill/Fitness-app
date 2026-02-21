(function(){
  "use strict";

  function calculateAdjustedCalories(currentTarget, insight, autoEnabled) {
    var base = +currentTarget || 0;
    var delta = (insight && isFinite(insight.calorieAdjustment)) ? +insight.calorieAdjustment : 0;
    var next = Math.max(1200, Math.round(base + delta));
    return {
      current: base,
      adjustment: delta,
      next: next,
      shouldApply: !!autoEnabled && !!delta
    };
  }

  window.NutritionCalorieAdjustmentEngine = {
    calculateAdjustedCalories: calculateAdjustedCalories
  };
})();
