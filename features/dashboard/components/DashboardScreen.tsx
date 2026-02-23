'use client';

import { motion } from 'framer-motion';
import { AppCard, AppSection, AppSkeleton, AppStat } from '@/components/design-system';
import type { DashboardData } from '../hooks/useDashboardData';
import { getReadinessMessage } from '../utils/getReadinessMessage';

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
      <motion.div className="h-full rounded-full bg-cyan-400" initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }} transition={{ duration: 0.35 }} />
    </div>
  );
}

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  return (
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      {Math.round(value)}
      {suffix}
    </motion.span>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <AppSkeleton className="h-32" />
      <div className="flex gap-3 overflow-hidden">
        <AppSkeleton className="h-12 min-w-28 flex-1" />
        <AppSkeleton className="h-12 min-w-28 flex-1" />
        <AppSkeleton className="h-12 min-w-28 flex-1" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <AppSkeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

export function DashboardScreen({ data, caloriesRemaining, proteinRemaining, showPR }: { data: DashboardData; caloriesRemaining: number; proteinRemaining: number; showPR: boolean }) {
  if (data.isNewUser) {
    return (
      <div className="p-4 space-y-4">
        <AppCard>
          <p className="text-2xl font-semibold">Welcome 👋</p>
          <p className="text-sm text-slate-300 mt-2">Start your first workout, set your goal, and log bodyweight to unlock smart coaching.</p>
        </AppCard>
        <div className="grid gap-3">
          {['Start your first workout', 'Set your goal', 'Log your bodyweight'].map((task) => (
            <AppCard key={task} className="py-5 font-medium">{task}</AppCard>
          ))}
        </div>
      </div>
    );
  }

  const readiness = getReadinessMessage(data);

  return (
    <motion.div className="space-y-4 p-4" initial="hidden" animate="visible" variants={container}>
      <motion.div variants={item}>
        <AppCard className={`bg-gradient-to-br ${readiness.tone}`}>
          <p className="text-xl font-semibold">{readiness.title}</p>
          <p className="text-sm text-slate-200 mt-1">{readiness.subtitle}</p>
        </AppCard>
      </motion.div>

      <motion.div variants={item} className="flex gap-3 overflow-x-auto pb-1 snap-x">
        {['Start Workout', 'Log Weight', 'Log Food', 'View Program'].map((label) => (
          <button
            key={label}
            className="snap-start min-w-[140px] rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold active:scale-[0.98]"
            onClick={() => navigator.vibrate?.(8)}
          >
            {label}
          </button>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <AppSection title="Next workout">
          <AppCard>
            {data.nextWorkout ? (
              <div className="space-y-2">
                <p className="text-lg font-semibold">{data.nextWorkout.name}</p>
                <p className="text-sm text-slate-300">{data.nextWorkout.primaryMuscles.join(' · ')} · {data.nextWorkout.exerciseCount} exercises</p>
                <p className="text-sm text-slate-400">Last performance: {data.nextWorkout.snapshot}</p>
                <button className="mt-2 rounded-lg bg-cyan-400 text-slate-950 px-4 py-2 text-sm font-semibold">Start Workout</button>
              </div>
            ) : (
              <p className="text-sm">Build your next session</p>
            )}
          </AppCard>
        </AppSection>
      </motion.div>

      <motion.div variants={item}>
        <AppSection title="Muscle balance · 7 days">
          <AppCard className="space-y-3">
            {data.muscleVolume7d.map((m) => (
              <div key={m.muscle} className="space-y-1">
                <div className="flex justify-between text-xs"><span>{m.muscle}</span><span className={m.status === 'optimal' ? 'text-emerald-300' : m.status === 'undertrained' ? 'text-amber-300' : 'text-rose-300'}>{m.status}</span></div>
                <ProgressBar value={m.value} />
              </div>
            ))}
          </AppCard>
        </AppSection>
      </motion.div>

      <motion.div variants={item}>
        <AppSection title="Goal progress">
          <AppCard className="space-y-2">
            {data.goal?.type === 'cutting' && <p className="text-sm">Weight trend vs target pace: <span className="font-semibold">{data.goal.paceDelta ?? 0} kg/week</span></p>}
            {data.goal?.type === 'bulking' && <p className="text-sm">Calorie adherence: <span className="font-semibold">{data.goal.adherencePct ?? 0}%</span></p>}
            {data.goal?.type === 'maintaining' && <p className="text-sm">Consistency score: <span className="font-semibold">{data.goal.consistencyScore ?? 0}/100</span></p>}
          </AppCard>
        </AppSection>
      </motion.div>

      <motion.div variants={item}>
        <AppSection title="Today's nutrition">
          <AppCard className="space-y-3">
            {!data.nutritionToday.hasLoggedFood ? (
              <p className="text-sm text-slate-300">Start tracking today&apos;s nutrition</p>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Calories remaining: {caloriesRemaining}</p>
                  <ProgressBar value={(data.nutritionToday.caloriesConsumed / (data.goal?.dailyCaloriesTarget || 1)) * 100} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Protein remaining: {proteinRemaining}g</p>
                  <ProgressBar value={(data.nutritionToday.proteinConsumed / (data.goal?.dailyProteinTarget || 1)) * 100} />
                </div>
              </>
            )}
          </AppCard>
        </AppSection>
      </motion.div>

      <motion.div variants={item}>
        <AppCard className="grid grid-cols-3 gap-3">
          <AppStat label="Current streak" value={<CountUp value={data.streakDays} />} />
          <AppStat label="Workouts this week" value={<CountUp value={data.workoutsThisWeek} />} />
          <AppStat label="Adherence" value={<CountUp value={data.adherencePct} suffix="%" />} />
        </AppCard>
      </motion.div>

      {showPR && data.recentPR ? (
        <motion.div variants={item}>
          <AppCard className="bg-gradient-to-r from-violet-500/25 to-fuchsia-500/25 border-violet-300/20">
            <p className="text-xs uppercase tracking-wide text-violet-200">New PR</p>
            <p className="text-lg font-semibold mt-1">{data.recentPR.exercise}</p>
            <p className="text-sm text-slate-100">{data.recentPR.weight}kg × {data.recentPR.reps} reps</p>
          </AppCard>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
