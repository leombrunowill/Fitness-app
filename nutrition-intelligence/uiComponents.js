(function(){
  "use strict";

  function ring(score) {
    var pct = Math.max(0, Math.min(100, Math.round(score)));
    return '<div class="ni-ring"><div class="ni-ring-fill" style="--p:'+pct+'"></div><div class="ni-ring-text">'+pct+'</div></div>';
  }

  function NutritionInsightCard(title, message, tone) {
    return '<div class="card ni-card tone-'+(tone||'neutral')+'"><div class="ni-title">'+title+'</div><div class="ni-copy">'+message+'</div></div>';
  }

  function RemainingMacrosCard(rem) {
    return '<div class="card ni-card"><div class="ni-title">Remaining today</div><div class="ni-grid">'+
      '<div><strong>'+rem.protein+'g</strong><span>Protein</span></div>'+
      '<div><strong>'+rem.carbs+'g</strong><span>Carbs</span></div>'+
      '<div><strong>'+rem.fat+'g</strong><span>Fat</span></div>'+
      '<div><strong>'+rem.calories+'</strong><span>kcal</span></div>'+
      '</div><div class="ni-sub">Min meals to hit protein: '+rem.minimumMealsForProtein+'</div></div>';
  }

  function ProteinScoreRing(scoreData) {
    return '<div class="card ni-card"><div class="ni-title">Protein Distribution Score</div>'+ring(scoreData.score)+'<div class="ni-sub">'+scoreData.insight+'</div></div>';
  }

  function CalorieAdjustmentAlert(adjustment) {
    if (!adjustment.adjustment) return '';
    var sign = adjustment.adjustment > 0 ? '+' : '';
    return '<div class="card ni-card tone-warn"><div class="ni-title">Calorie Adjustment</div><div class="ni-copy">Suggested target: '+adjustment.next+' kcal ('+sign+adjustment.adjustment+').</div></div>';
  }

  function DailyChecklist(items) {
    var li = (items || []).map(function(it){
      return '<li>'+(it.done ? '✔' : '○')+' '+it.label+'</li>';
    }).join('');
    return '<div class="card ni-card"><div class="ni-title">Smart Daily Checklist</div><ul class="ni-list">'+li+'</ul></div>';
  }

  window.NutritionIntelligenceUI = {
    NutritionInsightCard: NutritionInsightCard,
    RemainingMacrosCard: RemainingMacrosCard,
    ProteinScoreRing: ProteinScoreRing,
    CalorieAdjustmentAlert: CalorieAdjustmentAlert,
    DailyChecklist: DailyChecklist
  };
})();
