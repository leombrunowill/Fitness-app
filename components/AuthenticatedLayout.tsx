'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PropsWithChildren, useMemo, useState } from 'react';
import { useSessionUser } from '@/components/providers/AppProviders';
import { getSupabaseBrowserClient } from '@/supabase/browserClient';

const tabs = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/workouts', label: 'Workouts' },
  { href: '/nutrition', label: 'Nutrition' },
  { href: '/profile', label: 'Profile' },
];

export function AuthenticatedLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { email, userId } = useSessionUser();
  const [signingOut, setSigningOut] = useState(false);

  const isAuthPage = useMemo(() => pathname?.startsWith('/login') || pathname?.startsWith('/auth'), [pathname]);

  const onSignOut = async () => {
    setSigningOut(true);
    await getSupabaseBrowserClient().auth.signOut();
    router.push('/login');
    router.refresh();
    setSigningOut(false);
  };

  if (isAuthPage) {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <p className="text-xs text-slate-300">{email || 'Guest'}</p>
          {userId ? (
            <button className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold" onClick={onSignOut} disabled={signingOut}>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          ) : (
            <Link href="/login" className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold">
              Sign in
            </Link>
          )}
        </div>
      </header>

      {children}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur">
        <ul className="mx-auto flex max-w-xl items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <li key={tab.href}>
                <Link href={tab.href} className={`rounded-lg px-3 py-2 text-xs font-semibold ${active ? 'bg-white/10 text-white' : 'text-slate-400'}`}>
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
