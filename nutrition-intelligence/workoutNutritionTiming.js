(function(){
  "use strict";

  function getWorkoutTimingGuidance(params) {
    var hasWorkoutToday = !!params.hasWorkoutToday;
    var nextWorkoutInMinutes = +params.nextWorkoutInMinutes;
    var proteinRemaining = +params.proteinRemaining || 0;
    if (hasWorkoutToday) {
      return {
        phase: "post",
        message: "You have " + proteinRemaining + "g protein remaining — log a recovery meal."
      };
    }
    if (isFinite(nextWorkoutInMinutes) && nextWorkoutInMinutes <= 90) {
      return {
        phase: "pre",
        message: "Consume 25g protein + 40g carbs in next 90 min."
      };
    }
    return {
      phase: "none",
      message: "No workout fueling action needed right now."
    };
  }

  window.NutritionWorkoutTiming = { getWorkoutTimingGuidance: getWorkoutTimingGuidance };
})();
