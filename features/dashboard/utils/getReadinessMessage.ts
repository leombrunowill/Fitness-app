import type { DashboardData } from '../hooks/useDashboardData';

export function getReadinessMessage(data: DashboardData) {
  switch (data.readiness) {
    case 'good_to_train':
      return {
        title: `Ready to train — ${data.nextWorkout?.name ?? 'Session day'}`,
        subtitle: data.lastWorkout
          ? `Last session: ${data.lastWorkout.name} · ${data.lastWorkout.snapshot}`
          : 'Your momentum is strong today.',
        tone: 'from-emerald-500/25 via-cyan-400/20 to-blue-500/20',
      };
    case 'recovery_needed':
      return {
        title: 'Recovery day — legs still fatigued',
        subtitle: data.readinessContext ?? 'Prioritize sleep, hydration, and a light walk.',
        tone: 'from-amber-500/30 via-orange-400/20 to-rose-500/20',
      };
    case 'behind_on_protein':
      return {
        title: `You need ${Math.max((data.goal?.dailyProteinTarget ?? 0) - data.nutritionToday.proteinConsumed, 0)}g protein today`,
        subtitle: 'Add a high-protein meal to stay on track.',
        tone: 'from-fuchsia-500/25 via-violet-500/20 to-indigo-500/20',
      };
    default:
      return {
        title: 'You are set for a great day',
        subtitle: 'Keep your habits tight and your effort high.',
        tone: 'from-slate-500/25 via-slate-400/20 to-slate-600/20',
      };
  }
}
