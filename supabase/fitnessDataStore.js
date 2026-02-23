(function(){
  var channels = [];
  var migrationKey = 'il_supabase_fitness_migrated';

  function getClient(){ return window.sb || null; }
  function nowIso(){ return new Date().toISOString(); }
  function uid(){ return Math.random().toString(36).slice(2); }
  function dateKeyFromIso(v){ return String(v || '').slice(0,10); }
  function safeParse(raw, fallback){ try { return JSON.parse(raw); } catch(_e){ return fallback; } }
  function ld(k,d){ try { var v=localStorage.getItem(k); return v?safeParse(v,d):d; } catch(_e){ return d; } }

  async function withUser(){
    var client = getClient();
    if (!client) return { client:null, user:null };
    var res = await client.auth.getUser();
    return { client:client, user:(res && res.data && res.data.user) ? res.data.user : null };
  }

  async function getBodyweightLogs(){
    var p = await withUser();
    if (!p.client || !p.user) return [];
    var res = await p.client.from('bodyweight_logs').select('*').eq('user_id', p.user.id).order('created_at', { ascending:true });
    if (res.error) throw res.error;
    return res.data || [];
  }

  async function logBodyweight(input){
    var p = await withUser();
    if (!p.client || !p.user) throw new Error('Not signed in');
    var payload = { user_id:p.user.id, weight:Number(input.weight || 0), created_at:input.created_at || nowIso() };
    var res = await p.client.from('bodyweight_logs').insert(payload).select('*').maybeSingle();
    if (res.error) throw res.error;
    return res.data;
  }

  async function getWorkouts(){
    var p = await withUser();
    if (!p.client || !p.user) return [];
    var res = await p.client.from('workouts').select('*, workout_sets(*)').eq('user_id', p.user.id).order('started_at', { ascending:false });
    if (res.error) throw res.error;
    return res.data || [];
  }

  async function createWorkout(input){
    var p = await withUser();
    if (!p.client || !p.user) throw new Error('Not signed in');
    var payload = { user_id:p.user.id, name:String(input.name || 'Workout'), started_at:input.started_at || nowIso(), completed_at:null };
    var res = await p.client.from('workouts').insert(payload).select('*').maybeSingle();
    if (res.error) throw res.error;
    return res.data;
  }

  async function logSet(input){
    var p = await withUser();
    if (!p.client || !p.user) throw new Error('Not signed in');
    var payload = {
      user_id:p.user.id,
      workout_id:input.workout_id,
      exercise_id:String(input.exercise_id || ''),
      weight:Number(input.weight || 0),
      reps:Number(input.reps || 0),
      rpe:input.rpe == null ? null : Number(input.rpe),
      is_warmup:!!input.is_warmup,
      created_at:input.created_at || nowIso()
    };
    var res = await p.client.from('workout_sets').insert(payload).select('*').maybeSingle();
    if (res.error) throw res.error;
    return res.data;
  }

  async function completeWorkout(workoutId, completedAt){
    var p = await withUser();
    if (!p.client || !p.user) throw new Error('Not signed in');
    var res = await p.client.from('workouts').update({ completed_at: completedAt || nowIso() }).eq('id', workoutId).eq('user_id', p.user.id).select('*').maybeSingle();
    if (res.error) throw res.error;
    return res.data;
  }

  async function getNutritionLogs(){
    var p = await withUser();
    if (!p.client || !p.user) return [];
    var res = await p.client.from('nutrition_logs').select('*').eq('user_id', p.user.id).order('created_at', { ascending:true });
    if (res.error) throw res.error;
    return res.data || [];
  }

  async function logFood(input){
    var p = await withUser();
    if (!p.client || !p.user) throw new Error('Not signed in');
    var payload = {
      user_id:p.user.id,
      food_name:String(input.food_name || ''),
      calories:Number(input.calories || 0), protein:Number(input.protein || 0), carbs:Number(input.carbs || 0), fat:Number(input.fat || 0),
      meal_type: input.meal_type || null,
      created_at:input.created_at || nowIso()
    };
    var res = await p.client.from('nutrition_logs').insert(payload).select('*').maybeSingle();
    if (res.error) throw res.error;
    return res.data;
  }

  async function getUserGoal(){
    var p = await withUser();
    if (!p.client || !p.user) return null;
    var res = await p.client.from('user_goals').select('*').eq('user_id', p.user.id).maybeSingle();
    if (res.error) throw res.error;
    return res.data || null;
  }

  async function updateUserGoal(input){
    var p = await withUser();
    if (!p.client || !p.user) throw new Error('Not signed in');
    var payload = {
      user_id:p.user.id,
      goal_type:input.goal_type || 'cut',
      target_weight: input.target_weight == null ? null : Number(input.target_weight),
      weekly_pace: input.weekly_pace == null ? null : Number(input.weekly_pace),
      daily_calorie_target: input.daily_calorie_target == null ? null : Number(input.daily_calorie_target),
      daily_protein_target: input.daily_protein_target == null ? null : Number(input.daily_protein_target),
      updated_at: nowIso()
    };
    var res = await p.client.from('user_goals').upsert(payload, { onConflict:'user_id' }).select('*').maybeSingle();
    if (res.error) throw res.error;
    return res.data;
  }

  async function isFitnessDataEmpty(){
    var p = await withUser();
    if (!p.client || !p.user) return true;
    var out = await Promise.all([
      p.client.from('bodyweight_logs').select('id', { head:true, count:'exact' }).eq('user_id', p.user.id),
      p.client.from('workouts').select('id', { head:true, count:'exact' }).eq('user_id', p.user.id),
      p.client.from('nutrition_logs').select('id', { head:true, count:'exact' }).eq('user_id', p.user.id)
    ]);
    return out.every(function(r){ return !r.error && (r.count || 0) === 0; });
  }

  async function migrateLocalDataIfNeeded(){
    if (localStorage.getItem(migrationKey) === '1') return { migrated:false, reason:'already_marked' };
    var hasLocal = !!Object.keys(ld('il_w', {})).length || !!Object.keys(ld('il_bw', {})).length || !!Object.keys(ld('il_nlog', {})).length;
    if (!hasLocal) return { migrated:false, reason:'no_local_data' };
    if (!(await isFitnessDataEmpty())) return { migrated:false, reason:'remote_not_empty' };

    var localW = ld('il_w', {});
    var localBW = ld('il_bw', {});
    var localN = ld('il_nlog', {});
    var localUser = ld('il_user', {});

    var workouts = [];
    Object.keys(localW).forEach(function(d){
      var exs = Array.isArray(localW[d]) ? localW[d] : [];
      if (!exs.length) return;
      workouts.push({ date:d, items:exs });
    });

    for (var wi=0; wi<workouts.length; wi++){
      var w = workouts[wi];
      var created = await createWorkout({ name:'Workout '+w.date, started_at:w.date+'T06:00:00.000Z' });
      for (var ei=0; ei<w.items.length; ei++){
        var ex = w.items[ei] || {};
        var sets = Array.isArray(ex.sets) ? ex.sets : [];
        for (var si=0; si<sets.length; si++){
          var st = sets[si] || {};
          await logSet({ workout_id: created.id, exercise_id: ex.exercise || ('exercise_'+uid()), weight: st.w || 0, reps: st.r || 0, rpe: st.rpe || null, is_warmup:false, created_at:w.date+'T06:00:00.000Z' });
        }
      }
      await completeWorkout(created.id, w.date+'T07:00:00.000Z');
    }

    var bwDates = Object.keys(localBW);
    for (var bi=0; bi<bwDates.length; bi++){
      var d = bwDates[bi];
      await logBodyweight({ weight:Number(localBW[d] || 0), created_at:d+'T08:00:00.000Z' });
    }

    var nd = Object.keys(localN);
    for (var ni=0; ni<nd.length; ni++){
      var date = nd[ni];
      var items = Array.isArray(localN[date]) ? localN[date] : [];
      for (var ii=0; ii<items.length; ii++){
        var it = items[ii] || {};
        await logFood({ food_name: it.name || 'Food', calories: it.cal || 0, protein: it.p || 0, carbs: it.c || 0, fat: it.f || 0, meal_type: it.meal_type || null, created_at: date+'T12:00:00.000Z' });
      }
    }

    await updateUserGoal({
      goal_type: localUser.goal_type || localUser.goalMode || 'cut',
      target_weight: localUser.bodyweightGoal || null,
      weekly_pace: localUser.weekly_rate_target || null,
      daily_calorie_target: localUser.dailyCalorieTarget || null,
      daily_protein_target: localUser.dailyProteinTarget || null
    });

    localStorage.setItem(migrationKey, '1');
    localStorage.removeItem('il_w');
    localStorage.removeItem('il_bw');
    localStorage.removeItem('il_nlog');
    localStorage.removeItem('il_workout_finished');
    return { migrated:true };
  }

  async function hydrateFitnessState(){
    var [bw, workouts, nutrition, goal] = await Promise.all([getBodyweightLogs(), getWorkouts(), getNutritionLogs(), getUserGoal()]);
    var W = {};
    var WFIN = {};
    workouts.forEach(function(w){
      var d = dateKeyFromIso(w.started_at || w.completed_at || w.created_at);
      if (!d) return;
      if (!W[d]) W[d] = [];
      var byExercise = {};
      (w.workout_sets || []).forEach(function(set){
        var exName = set.exercise_id || 'Exercise';
        if (!byExercise[exName]) byExercise[exName] = { group:'Imported', exercise:exName, sets:[] };
        byExercise[exName].sets.push({ r:Number(set.reps || 0), w:Number(set.weight || 0), rpe:set.rpe });
      });
      Object.keys(byExercise).forEach(function(k){ W[d].push(byExercise[k]); });
      WFIN[d] = !!w.completed_at;
    });

    var BW = {};
    bw.forEach(function(row){ var d = dateKeyFromIso(row.created_at); if (d) BW[d] = Number(row.weight || 0); });

    var NLOG = {};
    nutrition.forEach(function(row){
      var d = dateKeyFromIso(row.created_at);
      if (!d) return;
      if (!NLOG[d]) NLOG[d] = [];
      NLOG[d].push({ id:row.id, name:row.food_name, cal:Number(row.calories || 0), p:Number(row.protein || 0), c:Number(row.carbs || 0), f:Number(row.fat || 0), meal_type:row.meal_type, at: Date.parse(row.created_at || '') || Date.now() });
    });

    return { W:W, WFIN:WFIN, BW:BW, NLOG:NLOG, goal:goal };
  }

  async function replaceAllFitnessData(snapshot){
    var p = await withUser();
    if (!p.client || !p.user) return;
    var userId = p.user.id;
    await p.client.from('workout_sets').delete().eq('user_id', userId);
    await p.client.from('workouts').delete().eq('user_id', userId);
    await p.client.from('bodyweight_logs').delete().eq('user_id', userId);
    await p.client.from('nutrition_logs').delete().eq('user_id', userId);

    var W = snapshot.W || {};
    var BW = snapshot.BW || {};
    var NLOG = snapshot.NLOG || {};
    var WFIN = snapshot.WFIN || {};

    var days = Object.keys(W).sort();
    for (var di=0; di<days.length; di++) {
      var day = days[di];
      var workoutItems = Array.isArray(W[day]) ? W[day] : [];
      if (!workoutItems.length) continue;
      var workout = await createWorkout({ name:'Workout '+day, started_at:day+'T06:00:00.000Z' });
      for (var ei=0; ei<workoutItems.length; ei++) {
        var ex = workoutItems[ei] || {};
        var sets = Array.isArray(ex.sets) ? ex.sets : [];
        for (var si=0; si<sets.length; si++) {
          var st = sets[si] || {};
          await logSet({ workout_id:workout.id, exercise_id:ex.exercise || 'Exercise', weight:st.w || 0, reps:st.r || 0, rpe:st.rpe || null, is_warmup:!!st.is_warmup, created_at:day+'T06:00:00.000Z' });
        }
      }
      if (WFIN[day]) await completeWorkout(workout.id, day+'T07:00:00.000Z');
    }

    var bwRows = Object.keys(BW).map(function(day){ return { user_id:userId, weight:Number(BW[day] || 0), created_at:day+'T08:00:00.000Z' }; }).filter(function(r){ return r.weight > 0; });
    if (bwRows.length) await p.client.from('bodyweight_logs').insert(bwRows);

    var nRows = [];
    Object.keys(NLOG).forEach(function(day){
      var list = Array.isArray(NLOG[day]) ? NLOG[day] : [];
      list.forEach(function(it){
        nRows.push({ user_id:userId, food_name:it.name || 'Food', calories:Number(it.cal || 0), protein:Number(it.p || 0), carbs:Number(it.c || 0), fat:Number(it.f || 0), meal_type:it.meal_type || null, created_at:day+'T12:00:00.000Z' });
      });
    });
    if (nRows.length) await p.client.from('nutrition_logs').insert(nRows);
  }

  function subscribeRealtime(onChange){
    var client = getClient();
    if (!client) return;
    channels.forEach(function(ch){ try { client.removeChannel(ch); } catch(_e){} });
    channels = ['bodyweight_logs','workouts','nutrition_logs'].map(function(table){
      return client.channel('fitness:'+table).on('postgres_changes', { event:'*', schema:'public', table:table }, function(){ if (typeof onChange === 'function') onChange(table); }).subscribe();
    });
  }

  window.IronLogFitnessDataStore = {
    getBodyweightLogs:getBodyweightLogs,
    logBodyweight:logBodyweight,
    getWorkouts:getWorkouts,
    createWorkout:createWorkout,
    logSet:logSet,
    completeWorkout:completeWorkout,
    getNutritionLogs:getNutritionLogs,
    logFood:logFood,
    getUserGoal:getUserGoal,
    updateUserGoal:updateUserGoal,
    migrateLocalDataIfNeeded:migrateLocalDataIfNeeded,
    hydrateFitnessState:hydrateFitnessState,
    replaceAllFitnessData:replaceAllFitnessData,
    subscribeRealtime:subscribeRealtime
  };
})();
