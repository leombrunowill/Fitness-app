(function(){
  "use strict";

  function buildMealProteinSeries(logItems) {
    var buckets = {};
    (logItems || []).forEach(function(item){
      var when = item.at ? new Date(item.at) : new Date();
      var key = when.getHours();
      buckets[key] = (buckets[key] || 0) + (+item.p || 0);
    });
    return Object.keys(buckets).sort(function(a,b){ return +a - +b; }).map(function(hour){
      return { hour: +hour, protein: Math.round(buckets[hour] * 10) / 10 };
    });
  }

  function proteinDistributionScore(series) {
    var feedings = (series || []).filter(function(s){ return s.protein > 0; });
    if (!feedings.length) return { score: 0, insight: "Log protein feedings to unlock coaching." };

    var feedingCountScore = (feedings.length >= 4 && feedings.length <= 6) ? 35 : Math.max(10, 35 - (Math.abs(feedings.length - 5) * 8));
    var rangeHits = feedings.filter(function(f){ return f.protein >= 25 && f.protein <= 45; }).length;
    var distributionScore = Math.round((rangeHits / feedings.length) * 45);
    var frontHalf = feedings.filter(function(f){ return f.hour < 15; }).reduce(function(s, f){ return s + f.protein; }, 0);
    var total = feedings.reduce(function(s, f){ return s + f.protein; }, 0);
    var timingScore = frontHalf >= (total * 0.45) ? 20 : 8;
    var score = Math.max(0, Math.min(100, feedingCountScore + distributionScore + timingScore));
    var insight = timingScore < 20 ? "Protein intake is back-loaded. Add 30g earlier in the day." : "Protein timing is well distributed.";

    return { score: score, insight: insight, feedings: feedings.length };
  }

  window.NutritionProteinDistribution = {
    buildMealProteinSeries: buildMealProteinSeries,
    proteinDistributionScore: proteinDistributionScore
  };
})();
