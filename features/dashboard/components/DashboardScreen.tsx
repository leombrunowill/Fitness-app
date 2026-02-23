'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppCard, AppSection, AppSkeleton, AppStat, CardContent, CardFooter, CardHeader } from '@/components/design-system';
import type { BodyweightTrend } from '../utils/getBodyweightTrend';
import type { DashboardData } from '@/data/dashboard';

const item = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <motion.div className="h-full rounded-full bg-cyan-400" initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }} transition={{ duration: 0.35 }} />
    </div>
  );
}

function MorningCheckIn({ bodyweight, onSave, isSaving, hasHistory }: { bodyweight: DashboardData['todayBodyweight']; onSave: (value: number) => void; isSaving: boolean; hasHistory: boolean }) {
  const [weight, setWeight] = useState('');
  const [open, setOpen] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(weight);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onSave(parsed);
    setWeight('');
    setOpen(false);
  };

  return (
    <AppCard className="min-h-[156px]">
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">Morning check-in</p>
      </CardHeader>
      <CardContent>
        {bodyweight ? (
          <>
            <p className="text-sm text-emerald-300">Bodyweight logged ✅</p>
            <p className="text-2xl font-semibold">{bodyweight.value} kg</p>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-200">{hasHistory ? 'No bodyweight logged for today.' : 'Log your first weigh-in'}</p>
            <button className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setOpen((v) => !v)}>
              {open ? 'Close' : 'Log bodyweight'}
            </button>
            {open ? (
              <form className="flex items-center gap-2" onSubmit={submit}>
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  placeholder="Enter today’s bodyweight"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                />
                <button type="submit" className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </form>
            ) : null}
          </>
        )}
      </CardContent>
    </AppCard>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <AppSkeleton className="h-10" />
      <AppSkeleton className="h-8" />
      {Array.from({ length: 8 }).map((_, i) => (
        <AppSkeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

function getTrendLabel(trend: BodyweightTrend) {
  if (trend === 'up') return 'Trending up';
  if (trend === 'down') return 'Trending down';
  if (trend === 'flat') return 'Stable trend';
  return 'Not enough data';
}

export function DashboardScreen({
  data,
  caloriesRemaining,
  proteinRemaining,
  bodyweightTrend,
  onLogBodyweight,
  onLogWorkout,
  onLogNutrition,
  bodyweightSaving,
  workoutSaving,
  nutritionSaving,
  isOnline,
  queueLength,
  lastRecomputeAt,
  userId,
}: {
  data: DashboardData;
  caloriesRemaining: number;
  proteinRemaining: number;
  bodyweightTrend: BodyweightTrend;
  onLogBodyweight: (value: number) => void;
  onLogWorkout: () => void;
  onLogNutrition: () => void;
  bodyweightSaving: boolean;
  workoutSaving: boolean;
  nutritionSaving: boolean;
  isOnline: boolean;
  queueLength: number;
  lastRecomputeAt: string | null;
  userId: string | null;
}) {
  const [showDebug, setShowDebug] = useState(false);
  const noWorkouts = data.streak.longest === 0 && !data.nextWorkout;

  return (
    <motion.div className="space-y-4 p-4" initial="hidden" animate="visible" variants={container}>
      <motion.div variants={item}>
        <p className="text-2xl font-semibold">Welcome back, {data.firstName} 👋</p>
      </motion.div>
      <motion.div variants={item}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300">{data.todayDateLabel}</p>
          <button onClick={() => setShowDebug((v) => !v)} className="text-xs text-slate-500">•••</button>
        </div>
      </motion.div>

      {showDebug ? (
        <motion.div variants={item}>
          <AppCard>
            <CardHeader><p className="text-sm uppercase text-slate-300">Debug panel</p></CardHeader>
            <CardContent>
              <p className="text-xs">user id: {userId || 'none'}</p>
              <p className="text-xs">query status: hydrated</p>
              <p className="text-xs">last recompute: {lastRecomputeAt || 'not yet'}</p>
              <p className="text-xs">supabase status: {isOnline ? 'online' : 'offline'}</p>
              <p className="text-xs">offline queue: {queueLength}</p>
            </CardContent>
          </AppCard>
        </motion.div>
      ) : null}

      <motion.div variants={item}>
        <MorningCheckIn bodyweight={data.todayBodyweight} onSave={onLogBodyweight} isSaving={bodyweightSaving} hasHistory={data.bodyweightLogs14d.length > 0} />
      </motion.div>

      <motion.div variants={item}>
        <AppSection title="Today plan">
          <AppCard className="min-h-[140px]">
            <CardContent>
              <p className="text-lg font-semibold break-words">{data.todayFocus.title}</p>
              <p className="text-sm text-slate-300 break-words">{data.todayFocus.description}</p>
            </CardContent>
            <CardFooter>
              <button className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">{data.todayFocus.actionLabel}</button>
            </CardFooter>
          </AppCard>
        </AppSection>
      </motion.div>

      <motion.div variants={item}>
        <AppSection title="Next workout">
          <AppCard className="min-h-[160px]">
            <CardContent>
              {noWorkouts ? (
                <p className="text-sm">Start your first workout</p>
              ) : data.nextWorkout ? (
                <>
                  <p className="text-lg font-semibold break-words">{data.nextWorkout.name}</p>
                  <p className="text-sm text-slate-300 break-words">{data.nextWorkout.primaryMuscles.join(' · ')} · {data.nextWorkout.exerciseCount} sets</p>
                </>
              ) : (
                <p className="text-sm">Build your next session</p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <button onClick={onLogWorkout} className="inline-flex rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" disabled={workoutSaving}>
                {workoutSaving ? 'Saving…' : 'Quick log workout'}
              </button>
              <Link href="/workouts" className="inline-flex rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100">Open workouts</Link>
            </CardFooter>
          </AppCard>
        </AppSection>
      </motion.div>

      <motion.div variants={item}>
        <AppCard className="min-h-[120px]">
          <CardHeader><p className="text-sm uppercase tracking-wide text-slate-300">Bodyweight trend</p></CardHeader>
          <CardContent><p className="text-lg font-semibold">{getTrendLabel(bodyweightTrend)}</p></CardContent>
        </AppCard>
      </motion.div>

      <motion.div variants={item}>
        <AppCard className="min-h-[170px]">
          <CardHeader><p className="text-sm uppercase tracking-wide text-slate-300">Weak point</p></CardHeader>
          <CardContent>
            {data.weakPoint ? (
              <>
                <p className="text-lg font-semibold break-words">{data.weakPoint.muscleGroup}</p>
                <p className="text-sm text-slate-300 break-words">{data.weakPoint.reason}</p>
              </>
            ) : (
              <p className="text-sm text-slate-300">No weak points detected in the last 30 days.</p>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-400">{data.weakPoint?.recommendation || 'Keep consistency high to unlock recommendations.'}</p>
            <button className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">View suggested exercises</button>
          </CardFooter>
        </AppCard>
      </motion.div>

      <motion.div variants={item}>
        <AppCard className="min-h-[180px]">
          <CardHeader><p className="text-sm uppercase tracking-wide text-slate-300">Today&apos;s nutrition</p></CardHeader>
          <CardContent>
            <div className="space-y-1"><p className="text-xs text-slate-400">Calories remaining: {caloriesRemaining}</p><ProgressBar value={(data.nutritionProgress.caloriesConsumed / (data.nutritionProgress.caloriesTarget || 1)) * 100} /></div>
            <div className="space-y-1"><p className="text-xs text-slate-400">Protein remaining: {proteinRemaining}g</p><ProgressBar value={(data.nutritionProgress.proteinConsumed / (data.nutritionProgress.proteinTarget || 1)) * 100} /></div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <button onClick={onLogNutrition} className="inline-flex rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950" disabled={nutritionSaving}>{nutritionSaving ? 'Saving…' : 'Quick log meal'}</button>
            <Link href="/nutrition" className="inline-flex rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">Open nutrition</Link>
          </CardFooter>
        </AppCard>
      </motion.div>

      <motion.div variants={item}>
        <AppCard className="min-h-[104px]">
          <CardHeader><p className="text-sm uppercase tracking-wide text-slate-300">Recovery score</p></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{data.recoveryScore}%</p></CardContent>
        </AppCard>
      </motion.div>

      <motion.div variants={item}>
        <AppCard>
          <CardContent className="grid grid-cols-3 gap-3">
            <AppStat label="Current streak" value={data.streak.current} />
            <AppStat label="Longest streak" value={data.streak.longest} />
            <AppStat label="Nutrition" value={`${data.nutritionAdherence}%`} />
          </CardContent>
        </AppCard>
      </motion.div>
    </motion.div>
  );
}
