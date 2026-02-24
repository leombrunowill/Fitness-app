'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/supabase/browserClient';
import { useSessionUser } from '@/components/providers/AppProviders';
import { logWorkoutEntry } from '@/data/dashboard';

type WorkoutRow = {
  id: string;
  name: string;
  started_at: string;
  completed_at: string | null;
};

type WorkoutSetRow = {
  id: string;
  workout_id: string;
  muscle_group: string | null;
  reps: number | null;
  created_at: string;
};

export function WorkoutsScreen() {
  const router = useRouter();
  const { userId, loading: userLoading } = useSessionUser();
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [setsByWorkoutId, setSetsByWorkoutId] = useState<Record<string, WorkoutSetRow[]>>({});
  const [name, setName] = useState('Quick workout');
  const [muscleGroup, setMuscleGroup] = useState('Full body');
  const [reps, setReps] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !userId) router.push('/login');
  }, [router, userId, userLoading]);

  const loadWorkouts = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
        const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session?.user?.id) {
      setWorkouts([]);
      setSetsByWorkoutId({});
      setIsLoading(false);
      return;
    }
    
    const workoutsRes = await supabase
      .from('workouts')
      .select('id,name,started_at,completed_at')
      .eq('user_id', session.user.id)
      .order('started_at', { ascending: false });

    if (workoutsRes.error) {
      setError(workoutsRes.error.message);
      setIsLoading(false);
      return;
    }

    const workoutRows = (workoutsRes.data || []) as WorkoutRow[];
     console.debug('[workouts] scoped fetch', { sessionUserId: session.user.id, workoutsReturned: workoutRows.length });
    setWorkouts(workoutRows);

    const workoutIds = workoutRows.map((workout) => workout.id);
    if (!workoutIds.length) {
      setSetsByWorkoutId({});
      setIsLoading(false);
      return;
    }

    const setsRes = await supabase
      .from('workout_sets')
      .select('id,workout_id,muscle_group,reps,created_at')
      .eq('user_id', session.user.id)
      .in('workout_id', workoutIds)
      .order('created_at', { ascending: true });

    if (setsRes.error) {
      setError(setsRes.error.message);
      setIsLoading(false);
      return;
    }

    const grouped: Record<string, WorkoutSetRow[]> = {};
    ((setsRes.data || []) as WorkoutSetRow[]).forEach((set) => {
      if (!grouped[set.workout_id]) grouped[set.workout_id] = [];
      grouped[set.workout_id].push(set);
    });

    setSetsByWorkoutId(grouped);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userLoading && userId) {
      void loadWorkouts();
    }
  }, [loadWorkouts, userId, userLoading]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await logWorkoutEntry({ name, muscleGroup, reps });
      await loadWorkouts();
    } catch (submitError) {
      setError((submitError as Error).message || 'Unable to save workout log.');
    } finally {
      setIsSaving(false);
    }
  };

  const canShow = !userLoading && !!userId;
  const totalSets = useMemo(
    () => workouts.reduce((sum, workout) => sum + (setsByWorkoutId[workout.id]?.length || 0), 0),
    [setsByWorkoutId, workouts],
  );

  if (!canShow) {
    return <div className="p-4 text-sm text-slate-200">Loading workouts…</div>;
  }

  return (
    <div className="space-y-4 p-4 text-slate-100">
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <h1 className="text-lg font-semibold">Log workout</h1>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Workout name"
          />
          <input
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"
            value={muscleGroup}
            onChange={(event) => setMuscleGroup(event.target.value)}
            placeholder="Primary muscle"
          />
          <input
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"
            value={reps}
            onChange={(event) => setReps(Number(event.target.value) || 0)}
            type="number"
            min={1}
            placeholder="Reps"
          />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : 'Save workout'}
        </button>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-semibold">Workout history</h2>
        <p className="mt-1 text-xs text-slate-300">{workouts.length} workouts · {totalSets} sets</p>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-300">Loading…</p>
        ) : workouts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-300">No workouts logged yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {workouts.map((workout) => (
              <li key={workout.id} className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
                <p className="font-medium">{workout.name}</p>
                <p className="text-xs text-slate-300">{new Date(workout.started_at).toLocaleString()}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {(setsByWorkoutId[workout.id] || []).map((set) => (
                    <li key={set.id}>
                      {(set.muscle_group || 'Full body')} · {set.reps || 0} reps
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
