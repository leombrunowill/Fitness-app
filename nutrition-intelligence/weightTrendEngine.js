(function(){
  "use strict";

  var DAY_MS = 86400000;

  function toTime(dateStr) { return new Date(dateStr + "T00:00:00").getTime(); }

  function sortLogs(logs) {
    return (logs || []).filter(function(l){ return l && l.date && isFinite(+l.weight); })
      .map(function(l){ return { date: l.date, weight: +l.weight }; })
      .sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  }

  function rollingAverage(logs, windowDays) {
    var rows = sortLogs(logs);
    var out = [];
    rows.forEach(function(row){
      var end = toTime(row.date);
      var start = end - (windowDays - 1) * DAY_MS;
      var inWindow = rows.filter(function(r){
        var t = toTime(r.date);
        return t >= start && t <= end;
      });
      var avg = inWindow.reduce(function(sum, r){ return sum + r.weight; }, 0) / (inWindow.length || 1);
      out.push({ date: row.date, average: Math.round(avg * 100) / 100, count: inWindow.length });
    });
    return out;
  }

  function weeklyRate(rolling) {
    if (!rolling || rolling.length < 2) return 0;
    var a = rolling[Math.max(0, rolling.length - 8)];
    var b = rolling[rolling.length - 1];
    var days = Math.max(1, Math.round((toTime(b.date) - toTime(a.date)) / DAY_MS));
    return ((b.average - a.average) / days) * 7;
  }

  function projectionToGoal(currentWeight, goalWeight, ratePerWeek) {
    if (!isFinite(currentWeight) || !isFinite(goalWeight) || !ratePerWeek) return null;
    var distance = goalWeight - currentWeight;
    if ((distance > 0 && ratePerWeek <= 0) || (distance < 0 && ratePerWeek >= 0)) return null;
    var weeks = Math.abs(distance / ratePerWeek);
    var days = Math.round(weeks * 7);
    var dt = new Date(Date.now() + (days * DAY_MS));
    return { weeks: Math.round(weeks * 10) / 10, date: dt.toISOString().slice(0,10) };
  }

  function buildWeightTrendInsight(params) {
    var actual = +params.actualRate || 0;
    var target = +params.targetRate || 0;
    var diff = target - actual;
    var direction = diff < 0 ? 1 : -1;
    var adjustment = Math.round(Math.abs(diff) * 300) * direction;

    if (Math.abs(diff) < 0.1) {
      return { message: "Weight trend is on target. Keep calories steady.", calorieAdjustment: 0, status: "on_track" };
    }

    if (target < 0 && actual > target) {
      return {
        message: "You are losing " + Math.abs(actual).toFixed(1) + " lb/week (target " + Math.abs(target).toFixed(1) + "). Reduce calories by " + Math.abs(adjustment) + ".",
        calorieAdjustment: -Math.abs(adjustment),
        status: "behind"
      };
    }

    if (target > 0 && actual > target) {
      return {
        message: "You are gaining faster than target. Decrease calories by " + Math.abs(adjustment) + ".",
        calorieAdjustment: -Math.abs(adjustment),
        status: "too_fast"
      };
    }

    return {
      message: "You are moving slower than target. Increase calories by " + Math.abs(adjustment) + ".",
      calorieAdjustment: Math.abs(adjustment),
      status: "too_slow"
    };
  }

  window.NutritionWeightTrendEngine = {
    rollingAverage: rollingAverage,
    weeklyRate: weeklyRate,
    projectionToGoal: projectionToGoal,
    buildWeightTrendInsight: buildWeightTrendInsight
  };
})();
