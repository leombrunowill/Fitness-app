'use client';

import { FormEvent, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AppCard, AppSection, AppSkeleton, AppStat, CardContent, CardFooter, CardHeader } from '@/components/design-system';
import type { BodyweightTrend } from '../utils/getBodyweightTrend';
import type { DashboardData } from '../hooks/useDashboardData';

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
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <motion.div className="h-full rounded-full bg-cyan-400" initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }} transition={{ duration: 0.35 }} />
    </div>
  );
}

function DateSelector({ todayLabel }: { todayLabel: string }) {
  const dates = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, index) => {
        const day = new Date();
        day.setDate(day.getDate() + index);
        return day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      }),
    [],
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950">{todayLabel}</button>
      {dates.slice(1).map((date) => (
        <button key={date} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200">
          {date}
        </button>
      ))}
    </div>
  );
}

function MorningCheckIn({
  bodyweight,
  onSave,
  isSaving,
}: {
  bodyweight: DashboardData['todayBodyweight'];
  onSave: (value: number) => void;
  isSaving: boolean;
}) {
  const [weight, setWeight] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(weight);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onSave(parsed);
    setWeight('');
  };

  return (
    <AppCard>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">Morning check-in</p>
      </CardHeader>
      <CardContent>
        {bodyweight ? (
          <>
            <p className="text-sm text-emerald-300">Bodyweight logged</p>
            <p className="text-2xl font-semibold">{bodyweight.value} kg</p>
            <p className="text-xs text-slate-400">{new Date(bodyweight.loggedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
          </>
        ) : (
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
              Save
            </button>
          </form>
        )}
      </CardContent>
      {bodyweight ? (
        <CardFooter>
          <button className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">Update</button>
        </CardFooter>
      ) : null}
    </AppCard>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <AppSkeleton className="h-20" />
      <AppSkeleton className="h-12" />
      {Array.from({ length: 6 }).map((_, i) => (
        <AppSkeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

function getTrendLabel(trend: BodyweightTrend) {
  if (trend === 'up') return 'Trending up';
  if (trend === 'down') return 'Trending down';
  if (trend === 'flat') return 'Stable trend';
  return 'Insufficient data (need 3 logs in 14 days)';
}

export function DashboardScreen({
  data,
  caloriesRemaining,
  proteinRemaining,
  bodyweightTrend,
  onLogBodyweight,
  bodyweightSaving,
}: {
  data: DashboardData;
  caloriesRemaining: number;
  proteinRemaining: number;
  bodyweightTrend: BodyweightTrend;
  onLogBodyweight: (value: number) => void;
  bodyweightSaving: boolean;
}) {
  return (
    <motion.div className="space-y-4 p-4" initial="hidden" animate="visible" variants={container}>
      <motion.div variants={item}>
        <AppCard>
          <CardHeader>
            <p className="text-2xl font-semibold">Welcome back, {data.firstName} 👋</p>
            <p className="text-sm text-slate-300">Here’s your plan for today</p>
          </CardHeader>
          <CardContent>
            <DateSelector todayLabel={data.todayDateLabel} />
          </CardContent>
        </AppCard>
      </motion.div>

      <motion.div variants={item}>
        <MorningCheckIn bodyweight={data.todayBodyweight} onSave={onLogBodyweight} isSaving={bodyweightSaving} />
      </motion.div>

      <motion.div variants={item}>
        <AppSection title="Next workout">
          <AppCard>
            <CardHeader>
              <p className="text-sm uppercase tracking-wide text-slate-300">Queued session</p>
            </CardHeader>
            <CardContent>
              {data.nextWorkout ? (
                <>
                  <p className="text-lg font-semibold">{data.nextWorkout.name}</p>
                  <p className="text-sm text-slate-300">{data.nextWorkout.primaryMuscles.join(' · ')} · {data.nextWorkout.exerciseCount} exercises</p>
                </>
              ) : (
                <p className="text-sm">Build your next session</p>
              )}
            </CardContent>
            <CardFooter>
              <button className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Start Workout</button>
            </CardFooter>
          </AppCard>
        </AppSection>
      </motion.div>

      <motion.div variants={item}>
        <AppSection title="Training status">
          <AppCard>
            <CardHeader>
              <p className="text-sm uppercase tracking-wide text-slate-300">Volume status</p>
            </CardHeader>
            <CardContent>
              {data.volumeStatus.map((m) => (
                <div key={m.muscle} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{m.muscle}</span>
                    <span className={m.status === 'optimal' ? 'text-emerald-300' : m.status === 'undertrained' ? 'text-amber-300' : 'text-rose-300'}>{m.status}</span>
                  </div>
                  <ProgressBar value={m.value} />
                </div>
              ))}
            </CardContent>
          </AppCard>
        </AppSection>
      </motion.div>

      <motion.div variants={item}>
        <AppCard>
          <CardHeader>
            <p className="text-sm uppercase tracking-wide text-slate-300">Bodyweight trend</p>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{getTrendLabel(bodyweightTrend)}</p>
          </CardContent>
        </AppCard>
      </motion.div>

      <motion.div variants={item}>
        <AppCard>
          <CardHeader>
            <p className="text-sm uppercase tracking-wide text-slate-300">Weak point</p>
          </CardHeader>
          <CardContent>
            {data.weakPoint ? (
              <>
                <p className="text-lg font-semibold">{data.weakPoint.muscleGroup}</p>
                <p className="text-sm text-slate-300">{data.weakPoint.reason}</p>
              </>
            ) : (
              <p className="text-sm text-slate-300">No weak points detected this week.</p>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-slate-400">{data.weakPoint?.recommendation || 'Keep consistency high to unlock recommendations.'}</p>
          </CardFooter>
        </AppCard>
      </motion.div>

      <motion.div variants={item}>
        <AppCard>
          <CardHeader>
            <p className="text-sm uppercase tracking-wide text-slate-300">Today&apos;s nutrition</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Calories remaining: {caloriesRemaining}</p>
              <ProgressBar value={(data.nutritionProgress.caloriesConsumed / (data.nutritionProgress.caloriesTarget || 1)) * 100} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Protein remaining: {proteinRemaining}g</p>
              <ProgressBar value={(data.nutritionProgress.proteinConsumed / (data.nutritionProgress.proteinTarget || 1)) * 100} />
            </div>
          </CardContent>
        </AppCard>
      </motion.div>

      <motion.div variants={item}>
        <AppCard>
          <CardContent className="grid grid-cols-3 gap-3">
            <AppStat label="Current streak" value={data.streak.current} />
            <AppStat label="Longest streak" value={data.streak.longest} />
            <AppStat label="Adherence" value={`${data.adherenceScore}%`} />
          </CardContent>
        </AppCard>
      </motion.div>
    </motion.div>
  );
}
