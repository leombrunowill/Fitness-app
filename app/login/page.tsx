'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/supabase/browserClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = getSupabaseBrowserClient();

    const result =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

    setMessage(mode === 'signup' ? 'Account created. Check email if confirmation is enabled.' : 'Signed in successfully.');
    router.push('/dashboard');
    router.refresh();
    setLoading(false);
  };

  const sendMagicLink = async () => {
    setLoading(true);
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setMessage(error ? error.message : 'Magic link sent. Check your email.');
    setLoading(false);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4">
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fitness App</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Sign in</h1>
        <p className="mt-1 text-sm text-slate-400">Use email + password or a magic link.</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button className="w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" disabled={loading} type="submit">
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <div className="mt-3 flex gap-2">
          <button className="flex-1 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold" onClick={() => setMode('signin')}>
            Email Sign In
          </button>
          <button className="flex-1 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold" onClick={() => setMode('signup')}>
            Sign Up
          </button>
        </div>

        <button className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm" onClick={sendMagicLink} disabled={loading || !email}>
          Send Magic Link
        </button>

        {message ? <p className="mt-3 text-xs text-slate-300">{message}</p> : null}
      </section>
    </main>
  );
}
