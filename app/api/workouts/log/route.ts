import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, getRouteHandlerUser } from '@/supabase/routeHandlerClient';

export async function POST(request: NextRequest) {
  const { user, error: userError } = await getRouteHandlerUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const now = new Date().toISOString();

  const name = String(body.name || '').trim() || 'Quick workout';
  const muscleGroup = String(body.muscle_group || '').trim() || 'Full body';
  const reps = Number(body.reps || 0) > 0 ? Number(body.reps) : 10;

  const supabase = createRouteHandlerClient();

  const workoutInsert = await supabase
    .from('workouts')
    .insert({ user_id: user.id, name, started_at: now, completed_at: now })
    .select('id,name,started_at,completed_at')
    .single();

  if (workoutInsert.error) {
    return NextResponse.json({ error: workoutInsert.error.message }, { status: 400 });
  }

  const setInsert = await supabase
    .from('workout_sets')
    .insert({
      user_id: user.id,
      workout_id: workoutInsert.data.id,
      muscle_group: muscleGroup,
      reps,
      completed: true,
      created_at: now,
    })
    .select('muscle_group,reps')
    .single();

  if (setInsert.error) {
    return NextResponse.json({ error: setInsert.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: { workout: workoutInsert.data, set: setInsert.data } }, { status: 200 });
}
