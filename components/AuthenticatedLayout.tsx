'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PropsWithChildren, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const tabs = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/workouts', label: 'Workouts' },
  { href: '/nutrition', label: 'Nutrition' },
  { href: '/profile', label: 'Profile' },
];

export function AuthenticatedLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const supabase = createClientComponentClient();
    supabase.auth.getSession().finally(() => setHydrated(true));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {children}
      {hydrated ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur">
          <ul className="mx-auto flex max-w-xl items-center justify-around px-2 py-2">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold ${active ? 'bg-white/10 text-white' : 'text-slate-400'}`}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
