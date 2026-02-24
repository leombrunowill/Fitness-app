import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, getRouteHandlerUser } from '@/supabase/routeHandlerClient';

export async function POST(request: NextRequest) {
  const { user, error: userError } = await getRouteHandlerUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
  const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
  const mealType = MEAL_TYPES.includes(body.meal_type) ? body.meal_type : 'snack';

  const payload = {
    user_id: user.id,
    food_name: String(body.food_name || '').trim(),
    calories: Number(body.calories || 0),
    protein: Number(body.protein || 0),
    carbs: Number(body.carbs || 0),
    fat: Number(body.fat || 0),
    meal_type: mealType,
    local_date: String(body.local_date || ''),
  };

  if (!payload.food_name || !/^\d{4}-\d{2}-\d{2}$/.test(payload.local_date)) {
    return NextResponse.json({ error: 'food_name and valid local_date are required' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient();
  const { data, error } = await supabase
    .from('nutrition_logs')
    .insert(payload)
    .select('id,user_id,food_name,calories,protein,carbs,fat,meal_type,local_date,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const { user, error: userError } = await getRouteHandlerUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient();
  const { error } = await supabase.from('nutrition_logs').delete().eq('user_id', user.id).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
