import { renderInsightCard } from '../components/InsightCard.js';
import { initRestTimer, startRestTimer } from '../components/RestTimer.js';
import { initTodayFocus } from './todayFocus.js';
import { initProgressRings } from './progressRings.js';
import { initBodyweightInsights } from './bodyweightInsights.js';
import { initVolumeMap } from './volumeMap.js';
import { initStreaks } from './streaks.js';
import { fetchDashboardData, upsertProfileSetup } from '../supabase/queries.js';

function fmt1(v) { return Math.round((+v || 0) * 10) / 10; }

function isoDaysAgo(daysBack) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

function normalizeName(v) {
  return String(v || '').trim().toLowerCase();
}

function toneFromVolume(cur, tgt) {
  if (!tgt) return 'yellow';
  if (cur < tgt * 0.7) return 'blue';
  if (cur > tgt * 1.15) return 'red';
  return 'green';
}

function analyticsFromRemote(remote, fallback, weekStartIso) {
  if (!remote || remote.error) return fallback;

  const targets = Object.assign({ Chest: 16, Back: 16, Legs: 18, Shoulders: 12, Arms: 10, Core: 8 }, (fallback && fallback.targets) || {});
  const muscleVolumes = { Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0, Core: 0 };
  const exById = {};
  const volumeByExercise = {};
  const map = {
    chest: 'Chest',
    back: 'Back',
    legs: 'Legs',
    shoulders: 'Shoulders',
    arms: 'Arms',
    core: 'Core'
  };

  (remote.exercises || []).forEach((ex) => {
    const id = ex.id || ex.exercise_id;
    if (!id) return;
    const primary = normalizeName(ex.primary_muscle || ex.group || ex.muscle_group);
    exById[String(id)] = {
      exercise: ex.name || ex.exercise_name || 'Exercise',
      muscle: map[primary] || null
    };
  });

  const setsInWindow = (remote.sets || []).filter((st) => {
    const at = String(st.date || st.workout_date || st.created_at || '');
    return !weekStartIso || !at || at.slice(0, 10) >= weekStartIso;
  });

  setsInWindow.forEach((st) => {
    const exId = st.exercise_id || st.exerciseId;
    const info = exById[String(exId)];
    if (info && info.muscle) muscleVolumes[info.muscle] += 1;

    if (info && info.exercise) {
      const reps = +(st.reps || st.r || 0);
      const weight = +(st.weight || st.w || 0);
      const score = reps * weight;
      if (!volumeByExercise[info.exercise]) volumeByExercise[info.exercise] = [];
      volumeByExercise[info.exercise].push(score);
    }
  });

  const exerciseProgress = Object.keys(volumeByExercise).map((name) => {
    const scores = volumeByExercise[name];
    const latest = scores[scores.length - 1] || 0;
    const prev = scores.length > 1 ? scores[scores.length - 2] : 0;
    const tone = prev > 0 ? (latest > prev * 1.02 ? 'green' : (latest < prev * 0.98 ? 'red' : 'yellow')) : 'yellow';
    return { exercise: name, prReady: prev > 0 && latest >= prev * 0.97, tone };
  });

  const workoutDates = Array.from(new Set((remote.workouts || []).map((w) => w.date).filter(Boolean))).sort().reverse();
  const workoutsInWindow = workoutDates.filter((d) => !weekStartIso || d >= weekStartIso);
  const bodyweightLogs = (remote.bodyweight || []).map((bw) => ({ date: bw.date, weight: +(bw.weight || bw.bodyweight || 0) }));

  const plan = ((fallback && fallback.weekly && fallback.weekly.workoutsPlanned) || 5);
  const workoutsDone = workoutsInWindow.length;
  const adherencePct = Math.round((plan ? Math.min(1, workoutsDone / plan) : 0) * 100);

  const profile = remote.profile || {};
  const profileGoalWeight = +(profile.bodyweight_goal || profile.goal_weight || 0);

  return Object.assign({}, fallback || {}, {
    targets,
    muscleVolumes,
    exerciseProgress,
    workoutDates,
    bodyweightLogs,
    prsThisWeek: exerciseProgress.filter((x) => x.prReady).length,
    adherencePct,
    goalWeight: profileGoalWeight || ((fallback && fallback.goalWeight) || 170),
    needsProfile: !(profile.training_goal || profile.experience_level),
    weekly: Object.assign({}, (fallback && fallback.weekly) || {}, {
      workoutsDone,
      setsDone: setsInWindow.length,
      setsTarget: ((fallback && fallback.weekly && fallback.weekly.setsTarget) || 90)
    }),
    volumeTones: Object.keys(targets).reduce((acc, muscle) => {
      acc[muscle] = toneFromVolume(muscleVolumes[muscle] || 0, targets[muscle] || 0);
      return acc;
    }, {})
  });
}

export async function initDashboard(ctx) {
  if (!ctx || ctx.view !== 'log') return;
  const mount = document.getElementById('dashboard-v2');
  if (!mount) return;

  let analytics = ctx.analytics || {};
  try {
    const weekStartIso = isoDaysAgo(6);
    const streakStartIso = isoDaysAgo(179);
    const remote = await fetchDashboardData(weekStartIso, streakStartIso);
    analytics = analyticsFromRemote(remote, analytics, weekStartIso);
  } catch (_err) {
    // graceful local fallback
  }

  const insights = initTodayFocus(analytics);
  const bw = initBodyweightInsights(analytics.bodyweightLogs, analytics.goalWeight);
  const streaks = initStreaks(analytics.workoutDates, analytics.prsThisWeek, analytics.adherencePct);

  mount.innerHTML = renderInsightCard(insights) +
    '<div id="rings-mount"></div>' +
    `<section class="card dash-card"><h2 class="dash-title">Bodyweight Intelligence</h2><div class="mini-grid"><div><span>Current</span><strong>${fmt1(bw.current)} lb</strong></div><div><span>7d Avg</span><strong>${fmt1(bw.avg7)} lb</strong></div><div><span>Weekly Rate</span><strong>${bw.weeklyChange >= 0 ? '+' : ''}${fmt1(bw.weeklyChange)} lb</strong></div><div><span>Projection</span><strong>${bw.weeks ? `Goal in ${bw.weeks} weeks` : 'Need more data'}</strong></div></div></section>` +
    `<section class="card dash-card"><h2 class="dash-title">Momentum</h2><div class="mini-grid"><div><span>Workout streak</span><strong>${streaks.streak} days</strong></div><div><span>PRs this week</span><strong>${streaks.prsThisWeek}</strong></div><div><span>Adherence</span><strong>${streaks.adherencePct}%</strong></div></div></section>` +
    '<div id="volume-map-mount"></div>' +
    '<button class="fab-start" id="start-workout-fab">Start Today\'s Workout</button>' +
    `${analytics.needsProfile ? '<section class="card dash-card"><h2 class="dash-title">Finish setting up your profile</h2><form id="profile-setup" class="profile-grid"><select name="goal" class="inp"><option value="cut">Cut</option><option value="maintain">Maintain</option><option value="bulk">Bulk</option></select><select name="experience" class="inp"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select><input class="inp" name="days" type="number" min="1" max="7" placeholder="Weekly training days"/><input class="inp" name="goal_weight" type="number" placeholder="Bodyweight goal (lb)"/><button class="btn bp" type="submit">Save Profile</button></form></section>' : ''}`;

  initProgressRings(document.getElementById('rings-mount'), analytics);
  initVolumeMap(document.getElementById('volume-map-mount'), analytics.muscleVolumes, analytics.targets);
  initRestTimer();

  const profileForm = document.getElementById('profile-setup');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(profileForm);
      await upsertProfileSetup({
        training_goal: fd.get('goal'),
        experience_level: fd.get('experience'),
        weekly_training_days: Number(fd.get('days') || 0),
        bodyweight_goal: Number(fd.get('goal_weight') || 0)
      });
      ctx.onProfileSaved && ctx.onProfileSaved(fd);
    });
  }

  const fab = document.getElementById('start-workout-fab');
  if (fab) fab.onclick = () => ctx.onQuickStart && ctx.onQuickStart();
}

export function initExerciseIntelligence() {
  document.querySelectorAll('.exercise-card').forEach((card) => {
    card.querySelectorAll('input[data-act="set-reps"], input[data-act="set-weight"]').forEach((input) => {
      input.addEventListener('change', () => {
        const tone = card.getAttribute('data-progress-tone') || 'yellow';
        card.classList.remove('prog-green', 'prog-yellow', 'prog-red');
        card.classList.add(`prog-${tone}`);
        const mode = (card.getAttribute('data-strength-mode') || 'hypertrophy');
        startRestTimer(mode);
      });
    });
  });
}

window.IronLogDashboard = { initDashboard, initExerciseIntelligence };
