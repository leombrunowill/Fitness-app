(function(){
  var DEFAULT_PROFILE = { lifter_mode:'auto', experience_score:0, preferred_units:'imperial', theme:'dark' };
  var PROFILE_SELECT_COLUMNS = 'id,lifter_mode,experience_score,preferred_units,theme,updated_at';
  var DEFAULT_SETTINGS = { auto_rest_timer:true, sound_enabled:true, haptics_enabled:false, adaptive_ui:true, manual_mode_override:false, onboarding_completed:false };
  var MUSCLE_BUCKETS = ['chest','back','quads','hamstrings','shoulders','biceps','triceps','calves','glutes'];
  var queueKey = 'il_offline_write_queue';

  function nowIso(){ return new Date().toISOString(); }
  function safeParse(v,d){ try { return JSON.parse(v); } catch(_e){ return d; } }
  function ld(k,d){ try { var v=localStorage.getItem(k); return v?safeParse(v,d):d; } catch(_e){ return d; } }
  function sv(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(_e){} }
  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function pick(obj, allowed){
    var out = {};
    Object.keys(obj || {}).forEach(function(k){ if (allowed.indexOf(k)>=0 && obj[k] !== undefined) out[k] = obj[k]; });
    return out;
  }
  function analytics(event, payload){
    if (window.sb && window.IronLogAuthUserId) {
      window.sb.from('analytics_events').insert({ user_id: window.IronLogAuthUserId, event_name: event, payload: payload || {}, created_at: nowIso() }).then(function(){}).catch(function(){});
    }
  }


  function extractMissingProfilesColumn(error){
    var msg = String((error && (error.message || error.details || error.hint)) || '');
    var match = msg.match(/profiles\.([a-zA-Z0-9_]+)/i) || msg.match(/'([a-zA-Z0-9_]+)'\s+column\s+of\s+'profiles'/i);
    return match ? match[1] : null;
  }

  function validateProfileUpdate(input){
    var allowed = ['lifter_mode','experience_score','preferred_units','theme'];
    var out = pick(input || {}, allowed);
    if (out.lifter_mode && ['beginner','intermediate','advanced','auto'].indexOf(out.lifter_mode) < 0) throw new Error('Invalid lifter_mode');
    if (out.experience_score != null) out.experience_score = Math.max(0, Math.round(Number(out.experience_score) || 0));
    return out;
  }
  function validateSettingsUpdate(input){
    var allowed = ['auto_rest_timer','sound_enabled','haptics_enabled','adaptive_ui','manual_mode_override','onboarding_completed'];
    var out = pick(input || {}, allowed);
    Object.keys(out).forEach(function(k){ out[k] = !!out[k]; });
    return out;
  }
  function validateWorkoutSet(input){
    if (!input || !input.exercise_id) throw new Error('exercise_id is required');
    return {
      workout_id: String(input.workout_id || ''),
      exercise_id: String(input.exercise_id || ''),
      muscle_group: String(input.muscle_group || '').toLowerCase(),
      secondary_muscle_group: input.secondary_muscle_group ? String(input.secondary_muscle_group).toLowerCase() : null,
      secondary_multiplier: input.secondary_multiplier == null ? 0.5 : Number(input.secondary_multiplier),
      weight: Number(input.weight || 0),
      reps: Math.max(0, Number(input.reps || 0)),
      rpe: input.rpe == null ? null : Number(input.rpe),
      completed: input.completed !== false,
      is_warmup: !!input.is_warmup
    };
  }

  var state = {
    profile: clone(DEFAULT_PROFILE),
    settings: clone(DEFAULT_SETTINGS),
    muscleVolume: MUSCLE_BUCKETS.reduce(function(acc,k){ acc[k]=0; return acc; }, {}),
    loading: false,
    saving: false,
    saveOk: false,
    error: null,
    initialized: false,
    offlineQueue: ld(queueKey, []),
    userId: null,
    channels: []
  };
  var listeners = [];

  function emit(){ listeners.forEach(function(fn){ try { fn(clone(state)); } catch(_e){} }); }

  function getClient(){ return window.sb || null; }

  function pushQueue(op, payload){
    state.offlineQueue.push({ op:op, payload:payload, created_at: nowIso() });
    sv(queueKey, state.offlineQueue);
  }

  async function flushQueue(){
    if (!navigator.onLine || !state.userId) return;
    var pending = state.offlineQueue.slice();
    if (!pending.length) return;
    state.offlineQueue = [];
    sv(queueKey, state.offlineQueue);
    for (var i=0;i<pending.length;i++) {
      var item = pending[i];
      try {
        if (item.op === 'update_profile') await updateUserProfile(item.payload, true);
        if (item.op === 'update_settings') await updateUserSettings(item.payload, true);
        if (item.op === 'log_set') await logWorkoutSet(item.payload, true);
      } catch(_e) {
        pushQueue(item.op, item.payload);
      }
    }
  }

  async function getUserProfile(){
    var client = getClient();
    if (!client || !state.userId) return clone(DEFAULT_PROFILE);
var res = await client.from('profiles').select(PROFILE_SELECT_COLUMNS).eq('id', state.userId).maybeSingle();
    if (res.error && extractMissingProfilesColumn(res.error)) {
      res = await client.from('profiles').select('*').eq('id', state.userId).maybeSingle();
    }
    if (res.error) throw res.error;
    return Object.assign({}, DEFAULT_PROFILE, res.data || {});
  }

  async function updateUserProfile(update, fromQueue){
    var client = getClient();
    var payload = validateProfileUpdate(update);
    if (!state.userId) throw new Error('Not signed in');
    if (!navigator.onLine && !fromQueue) { pushQueue('update_profile', payload); return state.profile; }
    var draft = Object.assign({}, state.profile, payload, { id: state.userId, updated_at: nowIso() });
    var workingDraft = Object.assign({}, draft);
    var res = null;
    for (var attempt = 0; attempt < 5; attempt++) {
      var q = client.from('profiles').upsert(workingDraft, { onConflict:'id' });
      q = q.select(attempt === 0 ? 'lifter_mode,experience_score,preferred_units,theme,updated_at' : '*').maybeSingle();
      res = await q;
      if (!res.error) break;
      var missingCol = extractMissingProfilesColumn(res.error);
      if (!missingCol) break;
      if (Object.prototype.hasOwnProperty.call(workingDraft, missingCol)) {
        delete workingDraft[missingCol];
        continue;
      }
      if (attempt === 0) continue;
      break;
    }
    if (!res || res.error) throw (res && res.error ? res.error : new Error('Failed to update profile'));
    if (payload.lifter_mode) analytics('lifter_mode_changed', { lifter_mode: payload.lifter_mode });
    return Object.assign({}, DEFAULT_PROFILE, res.data || workingDraft);
  }

  async function getUserSettings(){
    var client = getClient();
    if (!client || !state.userId) return clone(DEFAULT_SETTINGS);
    var res = await client.from('user_settings').select('user_id,auto_rest_timer,sound_enabled,haptics_enabled,adaptive_ui,manual_mode_override,onboarding_completed,updated_at').eq('user_id', state.userId).maybeSingle();
    if (res.error) throw res.error;
    return Object.assign({}, DEFAULT_SETTINGS, res.data || {});
  }

  async function updateUserSettings(update, fromQueue){
    var client = getClient();
    var payload = validateSettingsUpdate(update);
    if (!state.userId) throw new Error('Not signed in');
    if (!navigator.onLine && !fromQueue) { pushQueue('update_settings', payload); return state.settings; }
    var draft = Object.assign({}, state.settings, payload, { user_id: state.userId, updated_at: nowIso() });
    var res = await client.from('user_settings').upsert(draft, { onConflict:'user_id' }).select('auto_rest_timer,sound_enabled,haptics_enabled,adaptive_ui,manual_mode_override,onboarding_completed,updated_at').maybeSingle();
    if (res.error) throw res.error;
    analytics('settings_changed', payload);
    return Object.assign({}, DEFAULT_SETTINGS, res.data || draft);
  }

  function scoreFromMetrics(m){
    return Math.round((m.total_workouts_logged||0)*4 + (m.total_sets_logged||0)*0.35 + (m.consistency_streak||0)*3 + (m.unique_exercises_used||0)*5);
  }

  async function recalcExperienceScore(){
    var client = getClient();
    if (!client || !state.userId) return;
    var workouts = await client.from('workouts').select('id,date,exercise_count').eq('user_id', state.userId);
    if (workouts.error) return;
    var sets = await client.from('workout_sets').select('id,exercise_id').eq('user_id', state.userId).eq('completed', true);
    if (sets.error) return;
    var dates = (workouts.data || []).map(function(w){ return w.date; }).filter(Boolean).sort();
    var streak = 0;
    if (dates.length) {
      streak = 1;
      for (var i=dates.length-1;i>0;i--) {
        var a = new Date(dates[i]+'T00:00:00Z');
        var b = new Date(dates[i-1]+'T00:00:00Z');
        if ((a-b) <= 36*60*60*1000) streak += 1; else break;
      }
    }
    var uniq = {};
    (sets.data||[]).forEach(function(s){ if (s.exercise_id) uniq[s.exercise_id]=1; });
    var score = scoreFromMetrics({ total_workouts_logged:(workouts.data||[]).length, total_sets_logged:(sets.data||[]).length, consistency_streak: streak, unique_exercises_used:Object.keys(uniq).length });
    state.profile = await updateUserProfile({ experience_score: score });
  }

  async function logWorkoutSet(input, fromQueue){
    var client = getClient();
    var payload = validateWorkoutSet(input);
    if (!state.userId) throw new Error('Not signed in');
    if (!navigator.onLine && !fromQueue) { pushQueue('log_set', payload); return null; }
    var res = await client.from('workout_sets').insert(Object.assign({ user_id: state.userId, created_at: nowIso() }, payload)).select('*').maybeSingle();
    if (res.error) throw res.error;
    analytics('workout_logged', { exercise_id: payload.exercise_id, reps: payload.reps, weight: payload.weight });
    await recalcExperienceScore();
    await refreshMuscleVolume();
    return res.data;
  }

  function normalizeMuscle(name){
    var n = String(name || '').toLowerCase();
    if (n === 'legs' || n === 'quads') return 'quads';
    if (n === 'glute' || n === 'glutes') return 'glutes';
    return n;
  }

  async function calculateMuscleVolume(dateRange){
    var client = getClient();
    var out = MUSCLE_BUCKETS.reduce(function(acc,k){ acc[k]=0; return acc; }, {});
    if (!client || !state.userId) return out;
    var q = client.from('workout_sets').select('muscle_group,secondary_muscle_group,secondary_multiplier').eq('user_id', state.userId).eq('completed', true).eq('is_warmup', false);
    if (dateRange && dateRange.start) q = q.gte('created_at', dateRange.start);
    if (dateRange && dateRange.end) q = q.lte('created_at', dateRange.end);
    var res = await q;
    if (res.error) throw res.error;
    (res.data || []).forEach(function(row){
      var p = normalizeMuscle(row.muscle_group);
      if (out[p] != null) out[p] += 1;
      var s = normalizeMuscle(row.secondary_muscle_group);
      var m = Number(row.secondary_multiplier == null ? 0.5 : row.secondary_multiplier);
      if (out[s] != null) out[s] += m;
    });
    return out;
  }

  async function refreshMuscleVolume(){
    state.muscleVolume = await calculateMuscleVolume();
    emit();
  }

  function resolvedLifterMode(){
    if (state.settings.manual_mode_override) return state.profile.lifter_mode || 'auto';
    var score = Number(state.profile.experience_score || 0);
    if (score < 80) return 'beginner';
    if (score < 180) return 'intermediate';
    return 'advanced';
  }

  function subscribeRealtime(){
    var client = getClient();
    if (!client || !state.userId) return;
    state.channels.forEach(function(ch){ try { client.removeChannel(ch); } catch(_e){} });
    state.channels = ['profiles','user_settings','workout_sets'].map(function(tbl){
      return client.channel('realtime:'+tbl+':'+state.userId).on('postgres_changes', { event:'*', schema:'public', table:tbl, filter:(tbl==='profiles' ? 'id=eq.' : 'user_id=eq.') + state.userId }, function(){ init(true); }).subscribe();
    });
  }

  async function init(silent){
    if (!state.userId) return;
    state.loading = !silent;
    state.error = null;
    emit();
    try {
      var pair = await Promise.all([getUserProfile(), getUserSettings()]);
      state.profile = pair[0];
      state.settings = pair[1];
      await refreshMuscleVolume();
      state.initialized = true;
      subscribeRealtime();
      await flushQueue();
    } catch (err) {
      state.error = (err && err.message) ? err.message : 'Failed to load user state';
    } finally {
      state.loading = false;
      emit();
    }
  }

  async function optimisticRun(target, patch, runner){
    var prev = clone(state[target]);
    state[target] = Object.assign({}, state[target], patch);
    state.saving = true;
    state.saveOk = false;
    emit();
    try {
      state[target] = await runner(patch);
      state.saveOk = true;
      setTimeout(function(){ state.saveOk = false; emit(); }, 1200);
    } catch (err) {
      state[target] = prev;
      state.error = (err && err.message) ? err.message : 'Update failed';
      throw err;
    } finally {
      state.saving = false;
      emit();
    }
  }

  window.addEventListener('online', function(){ flushQueue().then(function(){ init(true); }); });

  window.IronLogUserStore = {
    subscribe: function(fn){ listeners.push(fn); fn(clone(state)); return function(){ listeners = listeners.filter(function(x){ return x!==fn; }); }; },
    setUser: function(userId){ state.userId = userId; window.IronLogAuthUserId = userId; if (userId) init(); },
    init: init,
    getState: function(){ return clone(state); },
    getResolvedLifterMode: resolvedLifterMode,
    getUserProfile: getUserProfile,
    updateUserProfile: function(update){ return optimisticRun('profile', update, updateUserProfile); },
    getUserSettings: getUserSettings,
    updateUserSettings: function(update){ return optimisticRun('settings', update, updateUserSettings); },
    logWorkoutSet: logWorkoutSet,
    calculateMuscleVolume: calculateMuscleVolume,
    validateProfileUpdate: validateProfileUpdate,
    validateSettingsUpdate: validateSettingsUpdate,
    validateWorkoutSet: validateWorkoutSet
  };
})();
