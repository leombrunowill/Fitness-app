(function(){
  function metricCard(opts){
    return '<article class="card card-elevated metric-card dashboard-stagger">' +
      '<p class="label-small">' + opts.label + '</p>' +
      '<p class="display-metric">' + opts.value + '</p>' +
      (opts.meta ? '<p class="home-meta">' + opts.meta + '</p>' : '') +
      '</article>';
  }

  function progressRing(opts){
    var pct = Math.max(0, Math.min(100, opts.percent || 0));
    return '<article class="progress-ring-card dashboard-stagger">' +
      '<svg class="progress-ring" viewBox="0 0 120 120" aria-hidden="true">' +
      '<defs><linearGradient id="ring-grad-' + opts.id + '" x1="0" x2="1"><stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--accent-2)"/></linearGradient></defs>' +
      '<circle cx="60" cy="60" r="48" class="ring-track"></circle>' +
      '<circle cx="60" cy="60" r="48" class="ring-value" style="stroke-dasharray:' + (pct * 3.02) + ' 999;stroke:url(#ring-grad-' + opts.id + ')"></circle>' +
      '</svg>' +
      '<p class="label-small">' + opts.label + '</p>' +
      '<p class="display-metric mono-number">' + opts.value + '</p>' +
      '</article>';
  }

  function topNav(title, subtitle){
    return '<section class="dashboard-hero dashboard-stagger"><p class="label-small">' + subtitle + '</p><h1 class="section-title">' + title + '</h1></section>';
  }

  function dashboard(data){
    var focus = data.focusHtml || '<div class="home-meta">No focus items yet.</div>';
    return '<section class="dashboard-page">' +
      topNav(data.greeting, data.headline) +
      '<section class="card card-elevated dashboard-stagger dashboard-focus">' +
        '<p class="label-small">Today\'s Focus</p>' +
        '<p class="display-metric">' + data.focusTitle + '</p>' +
        '<p class="home-meta">' + data.focusMeta + '</p>' +
        '<div class="dashboard-focus-body">' + focus + '</div>' +
      '</section>' +
      '<section class="ring-grid">' +
        progressRing({id:'a',label:'Adherence',value:data.adherence + '%',percent:data.adherence}) +
        progressRing({id:'b',label:'Calories',value:data.calories + ' kcal',percent:data.caloriePct}) +
        progressRing({id:'c',label:'Protein',value:data.protein + ' g',percent:data.proteinPct}) +
      '</section>' +
      '<section class="dashboard-duo">' +
        metricCard({label:'Bodyweight Trend', value:data.weightValue, meta:data.weightMeta}) +
        metricCard({label:'Momentum', value:data.momentumValue, meta:data.momentumMeta}) +
      '</section>' +
    '</section>';
  }

  window.IronLogUI = {
    MetricCard: metricCard,
    ProgressRing: progressRing,
    TopNav: topNav,
    renderDashboard: dashboard
  };
})();
