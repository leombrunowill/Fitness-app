'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/supabase/browserClient';
import { useSessionUser } from '@/components/providers/AppProviders';

export default function NutritionDiagnosticsPage() {
  const { userId, loading } = useSessionUser();
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return <div className="p-4 text-sm text-slate-300">Diagnostics is available in development only.</div>;
  }

  const runTest = async () => {
    if (!userId) return;
    setRunning(true);
    const supabase = getSupabaseBrowserClient();
    const localDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

    const insertRes = await supabase
      .from('nutrition_logs')
      .insert({ user_id: userId, food_name: '__diag__', calories: 1, protein: 1, carbs: 1, fat: 1, meal_type: 'snack', local_date: localDate })
      .select('id,created_at,local_date')
      .single();

    const rowCountRes = await supabase.from('nutrition_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('local_date', localDate);

    let deleteRes: any = null;
    if (insertRes.data?.id) {
      deleteRes = await supabase.from('nutrition_logs').delete().eq('user_id', userId).eq('id', insertRes.data.id);
    }

    setResult({
      localDate,
      insert: insertRes,
      todayCount: rowCountRes.count ?? 0,
      delete: deleteRes,
    });
    setRunning(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4 text-sm text-slate-100">
      <h1 className="text-xl font-semibold">Nutrition Diagnostics</h1>
      <p>Session status: {loading ? 'loading…' : userId ? `signed in (${userId})` : 'not signed in'}</p>
      <button disabled={!userId || running} onClick={runTest} className="rounded-lg bg-indigo-500 px-4 py-2 font-medium disabled:opacity-50">
        {running ? 'Running…' : 'Run RLS insert/read/delete test'}
      </button>
      <pre className="overflow-auto rounded-xl bg-slate-900 p-3 text-xs">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
