(function(){
  "use strict";

  function initNutritionIntelligence(input) {
    var W = window.NutritionWeightTrendEngine;
    var C = window.NutritionCalorieAdjustmentEngine;
    var P = window.NutritionProteinDistribution;
    var M = window.NutritionMealsRemaining;
    var A = window.NutritionAdherenceScore;
    var Y = window.NutritionPhysiqueStatus;
    var T = window.NutritionWorkoutTiming;

      if (!W || !C || !P || !M || !A || !Y || !T) {
      return null;
    }

    var rolling = W.rollingAverage(input.bodyweightLogs, 7);
    var weeklyRate = W.weeklyRate(rolling);
    var latestAvg = rolling.length ? rolling[rolling.length - 1].average : null;
    var projection = W.projectionToGoal(latestAvg, input.goalWeight, input.weeklyRateTarget);
    var trendInsight = W.buildWeightTrendInsight({ actualRate: weeklyRate, targetRate: input.weeklyRateTarget });
    var adjustment = C.calculateAdjustedCalories(input.calorieTarget, trendInsight, input.autoCalorieAdjustments);

    var remaining = M.calcRemaining({
      calories: input.targets.calories,
      protein: input.targets.protein,
      carbs: input.targets.carbs,
      fat: input.targets.fat
    }, {
      calories: input.totals.calories,
      protein: input.totals.protein,
      carbs: input.totals.carbs,
      fat: input.totals.fat
    });

    var mealProteinSeries = P.buildMealProteinSeries(input.logItems);
    var proteinScore = P.proteinDistributionScore(mealProteinSeries);
    var calorieScore = A.calorieAdherenceScore(input.last7DaysNutrition, input.calorieTarget);
    var workoutGuidance = T.getWorkoutTimingGuidance({
      hasWorkoutToday: input.hasWorkoutToday,
      nextWorkoutInMinutes: input.nextWorkoutInMinutes,
      proteinRemaining: remaining.protein
    });

    var status = Y.buildPhysiqueStatus({
      weightStatus: trendInsight.status,
      calorieScore: calorieScore,
      proteinHitRate: Math.min(100, Math.round((input.totals.protein / Math.max(1, input.targets.protein)) * 100)),
      workoutRate: input.workoutAdherence,
      goalType: input.goalType
    });

    return {
      rolling: rolling,
      weeklyRate: weeklyRate,
      projection: projection,
      trendInsight: trendInsight,
      calorieAdjustment: adjustment,
      remaining: remaining,
      proteinScore: proteinScore,
      calorieScore: calorieScore,
      workoutGuidance: workoutGuidance,
      physiqueStatus: status
    };
  }

  window.initNutritionIntelligence = initNutritionIntelligence;
})();
