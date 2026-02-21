(function(){
  "use strict";

  function num(v) {
    var n = +v;
    return Number.isFinite(n) ? n : 0;
  }

  function rem(target, current) {
    var value = Math.round((num(target) - num(current)) * 10) / 10;
    return value > 0 ? value : 0;
  }

  function calcRemaining(targets, totals) {
    var safeTargets = targets || {};
    var safeTotals = totals || {};
    return {
      calories: Math.max(0, Math.round(num(safeTargets.calories) - num(safeTotals.calories))),
      protein: rem(safeTargets.protein, safeTotals.protein),
      carbs: rem(safeTargets.carbs, safeTotals.carbs),
      fat: rem(safeTargets.fat, safeTotals.fat)
    };
  }

  window.NutritionMealsRemaining = {
    calcRemaining: calcRemaining
  };
})();
