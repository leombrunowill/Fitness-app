'use client';

import { useMemo } from 'react';
import { useNutritionDay } from '@/hooks/useNutritionDay';
import { readNutritionDiagnostics } from '@/data/nutritionDiagnostics';
import { useSessionUser } from '@/components/providers/AppProviders';

function todayLocalDate() {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export default function NutritionDiagnosticsPage() {
  const localDate = todayLocalDate();
  const { userId, loading } = useSessionUser();
  const dayQuery = useNutritionDay(localDate);
  const snapshot = useMemo(() => readNutritionDiagnostics(), []);

  if (process.env.NODE_ENV === 'production') {
    return <div className="p-4 text-sm text-slate-300">Diagnostics is available in development only.</div>;
  }

  const rows = userId
    ? Object.values(dayQuery.data?.meals || {}).flat().slice(0, 5)
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 text-sm text-slate-100">
      <h1 className="text-xl font-semibold">Nutrition Diagnostics</h1>
      <div className="rounded-xl bg-slate-900 p-3">Session user id: {loading ? 'loading…' : userId || 'not signed in'}</div>
      <div className="rounded-xl bg-slate-900 p-3">Rows returned for today: {dayQuery.data ? Object.values(dayQuery.data.meals).flat().length : 0}</div>
      <section className="rounded-xl bg-slate-900 p-3">
        <h2 className="mb-2 font-semibold">Last API request payload</h2>
        <pre className="overflow-auto text-xs">{JSON.stringify(snapshot?.payload || null, null, 2)}</pre>
      </section>
      <section className="rounded-xl bg-slate-900 p-3">
        <h2 className="mb-2 font-semibold">Last API response</h2>
        <pre className="overflow-auto text-xs">{JSON.stringify(snapshot?.response || null, null, 2)}</pre>
      </section>
      <section className="rounded-xl bg-slate-900 p-3">
        <h2 className="mb-2 font-semibold">Last 5 nutrition_logs rows (from query)</h2>
        <pre className="overflow-auto text-xs">{JSON.stringify(rows, null, 2)}</pre>
      </section>
    </div>
  );
}
