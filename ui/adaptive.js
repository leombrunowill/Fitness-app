(function(){
  var KEY = 'il_behavior_profile';
  function ld(k,d){ try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } }
  function sv(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }

  function detectDevice(){
    var w = window.innerWidth || 390;
    if (w >= 1024) return 'desktop';
    if (w >= 720) return 'tablet';
    return 'mobile';
  }

  function getTimeSegment(){
    var h = new Date().getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 16 && h < 20) return 'preworkout';
    if (h >= 22 || h < 4) return 'latenight';
    return 'day';
  }

  function getTrainingPhase(stats){
    if ((stats.consistency || 0) >= 80 && (stats.weeklyVolume || 0) >= 45) return 'peak';
    if ((stats.consistency || 0) < 45) return 'rebuild';
    if ((stats.weeklyVolume || 0) < 25) return 'base';
    return 'build';
  }

  function detectMode(ctx){
    var o = (ctx.user && ctx.user.manualModeOverride) || 'auto';
    if (o !== 'auto') return o;
    var score = 0;
    score += Math.min(40, (ctx.workoutCount || 0));
    score += Math.min(30, Math.round((ctx.consistency || 0) / 3));
    score += Math.min(30, (ctx.exerciseVariety || 0) * 2);
    if (score < 35) return 'beginner';
    if (score < 70) return 'intermediate';
    return 'advanced';
  }

  function getBehavior(){
    return ld(KEY, {skipRest:0, fastProgress:0, missedSessions:0, navUse:{home:0,track:0,plan:0,progress:0,social:0,profile:0}});
  }

  function trackBehavior(event, payload){
    var b = getBehavior();
    if (event === 'skip_rest') b.skipRest += 1;
    if (event === 'fast_progress') b.fastProgress += 1;
    if (event === 'missed_session') b.missedSessions += 1;
    if (event === 'nav_visit' && payload && payload.view) {
      b.navUse[payload.view] = (b.navUse[payload.view] || 0) + 1;
    }
    sv(KEY, b);
    return b;
  }

  function navPriority(current){
    var b = getBehavior();
    var keys = Object.keys(b.navUse || {});
    var sorted = keys.sort(function(a,bk){ return (b.navUse[bk]||0) - (b.navUse[a]||0); });
    if (current && sorted.indexOf(current) < 0) sorted.unshift(current);
    return sorted;
  }

  function homeCards(ctx){
    var b = getBehavior();
    var cards = [
      {id:'recovery', title:'Recovery score', value: ctx.recovery + '%', hint: 'Sleep + strain balance', score: 95},
      {id:'next', title:'Next workout', value: ctx.nextWorkout || 'Program day', hint: ctx.readiness, score: 90},
      {id:'volume', title:'Volume status', value: ctx.volumeStatus || 'Balanced', hint: 'Per muscle landmarks', score: 75},
      {id:'pr', title:'PR prediction', value: ctx.prPrediction || 'Ready soon', hint: 'Trend-based projection', score: b.fastProgress > 2 ? 88 : 55},
      {id:'streak', title:'Streak tracker', value: (ctx.streak||0) + ' days', hint: 'Consistency momentum', score: 70},
      {id:'weight', title:'Bodyweight trend', value: ctx.weightTrend || 'Stable', hint: '7-day trajectory', score: 68},
      {id:'weak', title:'Weak point alert', value: ctx.weakPoint || 'None critical', hint: 'Bring up lagging groups', score: 62},
      {id:'nutrition', title:'Nutrition adherence', value: ctx.nutrition + '%', hint: 'Calories + protein execution', score: 66}
    ];

    if (ctx.timeSegment === 'morning') cards.unshift({id:'morning', title:'Morning check-in', value:'Log bodyweight', hint:'Hydrate + review daily goal', score: 99});
    if (ctx.timeSegment === 'preworkout') cards.unshift({id:'pre', title:'Ready to train?', value:'Quick start', hint:'Warm-up + checklist', score: 98});
    if (ctx.timeSegment === 'latenight') cards.unshift({id:'sleep', title:'Recovery tonight', value:'Wind down', hint:'Sleep is your anabolic edge', score: 98});
    if (b.missedSessions > 2) cards.unshift({id:'quick', title:'Quick workout', value:'20-minute fallback', hint:'Get a win today', score: 97});
    if (b.skipRest > 3) cards.unshift({id:'restwarn', title:'Rest warning', value:'You rush sets', hint:'Longer rest boosts output', score: 96});

    return cards.sort(function(a,bk){ return (bk.score||0) - (a.score||0); }).slice(0, ctx.mode === 'beginner' ? 4 : (ctx.mode === 'intermediate' ? 6 : 8));
  }

  function renderCards(cards){
    return '<section class="adaptive-card-grid">' + cards.map(function(c){
      return '<article class="card adaptive-card"><p class="label-small">'+c.title+'</p><p class="adaptive-value">'+c.value+'</p><p class="home-meta">'+c.hint+'</p></article>';
    }).join('') + '</section>';
  }

  function workoutModeShell(ctx){
    return '<section class="card workout-mode-shell">' +
      '<div class="workout-mode-top"><span>Workout mode</span><strong>'+ctx.phase+'</strong></div>'+
      '<div class="workout-focus">'+(ctx.exercise || 'Start your first movement')+'</div>'+
      '<div class="home-meta">Swipe to log set • Auto rest timer • High-contrast focus UI</div>'+
      '<div class="workout-actions"><button class="btn bp">Log Set</button><button class="btn bs" id="skip-rest-behavior">Skip Rest</button></div>'+
      '</section>';
  }

  window.IronLogAdaptive = {
    detectDevice: detectDevice,
    getTimeSegment: getTimeSegment,
    getTrainingPhase: getTrainingPhase,
    detectMode: detectMode,
    getBehavior: getBehavior,
    trackBehavior: trackBehavior,
    navPriority: navPriority,
    homeCards: homeCards,
    renderCards: renderCards,
    workoutModeShell: workoutModeShell
  };
})();
