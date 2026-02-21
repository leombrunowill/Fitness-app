(function(){
  "use strict";

  function calorieAdherenceScore(days, targetCalories) {
    var tgt = Math.max(1, +targetCalories || 1);
    var rows = (days || []).slice(-7);
    if (!rows.length) return 0;
    var perDay = rows.map(function(day){
      var cals = +day.calories || 0;
      var gap = Math.abs(cals - tgt);
      var pctOff = Math.min(1, gap / tgt);
      return Math.max(0, 100 - (pctOff * 100));
    });
    var avg = perDay.reduce(function(s, v){ return s + v; }, 0) / perDay.length;
    return Math.round(avg);
  }

  window.NutritionAdherenceScore = { calorieAdherenceScore: calorieAdherenceScore };
})();
