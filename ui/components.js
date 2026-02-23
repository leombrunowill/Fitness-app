(function(){
  var DS = window.DesignSystem || {};

  function metricCard(opts){
    return DS.AppCard(
      DS.AppStat(opts.label, opts.value, opts.meta),
      { loading: opts.loading, disabled: opts.disabled }
    );
  }

  function progressRing(opts){
    var pct = Math.max(0, Math.min(100, opts.percent || 0));
    return DS.AppCard(
      '<svg class="progress-ring" viewBox="0 0 120 120" aria-hidden="true">' +
      '<defs><linearGradient id="ring-grad-' + opts.id + '" x1="0" x2="1"><stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--success)"/></linearGradient></defs>' +
      '<circle cx="60" cy="60" r="48" class="ring-track"></circle>' +
      '<circle cx="60" cy="60" r="48" class="ring-value" style="stroke-dasharray:' + (pct * 3.02) + ' 999;stroke:url(#ring-grad-' + opts.id + ')"></circle>' +
      '</svg>' + DS.AppStat(opts.label, opts.value),
      { loading: opts.loading, disabled: opts.disabled }
    );
  }

  function topNav(title, subtitle){
    return DS.AppSection('', '<p class="AppStat-label">' + subtitle + '</p><h1 class="section-title">' + title + '</h1>');
  }

  function dashboard(data){
    var focus = data.focusHtml || '<div class="home-meta">No focus items yet.</div>';
    return DS.AppPage(
      DS.AppContainer(
        DS.AppGrid(
          topNav(data.greeting, data.headline) +
          DS.AppSection('Today\'s Focus', DS.AppCard(
            '<p class="AppStat-value">' + data.focusTitle + '</p>' +
            '<p class="home-meta">' + data.focusMeta + '</p>' +
            '<div class="dashboard-focus-body">' + focus + '</div>'
          )) +
          '<section class="ring-grid">' +
            progressRing({id:'a',label:'Adherence',value:data.adherence + '%',percent:data.adherence}) +
            progressRing({id:'b',label:'Calories',value:data.calories + ' kcal',percent:data.caloriePct}) +
            progressRing({id:'c',label:'Protein',value:data.protein + ' g',percent:data.proteinPct}) +
          '</section>' +
          '<section class="dashboard-duo">' +
            metricCard({label:'Bodyweight Trend', value:data.weightValue, meta:data.weightMeta}) +
            metricCard({label:'Momentum', value:data.momentumValue, meta:data.momentumMeta}) +
          '</section>'
        )
      )
    );
  }

  window.IronLogUI = {
    AppCard: DS.AppCard,
    AppButton: DS.AppButton,
    AppInput: DS.AppInput,
    AppSwitch: DS.AppSwitch,
    AppSelect: DS.AppSelect,
    AppSkeleton: DS.AppSkeleton,
    AppSection: DS.AppSection,
    AppStat: DS.AppStat,
    AppPage: DS.AppPage,
    AppContainer: DS.AppContainer,
    AppGrid: DS.AppGrid,
    MetricCard: metricCard,
    ProgressRing: progressRing,
    TopNav: topNav,
    renderDashboard: dashboard
  };
})();
