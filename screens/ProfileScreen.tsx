'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/supabase/browserClient';
import { useSessionUser } from '@/components/providers/AppProviders';

export function ProfileScreen() {
  const router = useRouter();
  const { userId, loading } = useSessionUser();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !userId) router.push('/login');
  }, [loading, userId, router]);

  useEffect(() => {
    const run = async () => {
      const sb = getSupabaseBrowserClient();
      const { data } = await sb.auth.getUser();
      setEmail(data.user?.email ?? null);
    };
    if (!loading && userId) void run();
  }, [loading, userId]);

  if (loading) return <div className="p-4 text-sm text-slate-200">Loading profile…</div>;
  if (!userId) return null;

  return (
    <div className="p-4 text-slate-100 space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-slate-300">
          Signed in as: <span className="text-slate-100">{email ?? userId}</span>
        </p>

        <button
          className="mt-4 inline-flex rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          onClick={async () => {
            const sb = getSupabaseBrowserClient();
            await sb.auth.signOut();
            router.push('/login');
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}