(function(){
  "use strict";

  function buildPhysiqueStatus(input) {
    var weightStatus = input.weightStatus || "on_track";
    var calorieScore = +input.calorieScore || 0;
    var proteinHitRate = +input.proteinHitRate || 0;
    var workoutRate = +input.workoutRate || 0;
    var goalType = input.goalType || "maintain";

    if (goalType === "cut" && (weightStatus === "behind" || calorieScore < 70)) return "Fat loss stalled";
    if (goalType === "bulk" && calorieScore >= 80 && proteinHitRate >= 80) return "Lean bulk progressing optimally";
    if (calorieScore >= 80 && proteinHitRate >= 75 && workoutRate >= 75) return "Cut is on track";
    return "Progress is mixed — tighten nutrition execution this week";
  }

  window.NutritionPhysiqueStatus = { buildPhysiqueStatus: buildPhysiqueStatus };
})();
