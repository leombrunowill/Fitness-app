'use client';

import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getSupabaseBrowserClient, syncAuthCookies } from '@/supabase/browserClient';
import { ToastProvider } from '@/components/providers/ToastProvider';

type SessionUserContextValue = { userId: string | null; email: string | null; loading: boolean };
const SessionUserContext = createContext<SessionUserContextValue>({ userId: null, email: null, loading: true });

export function useSessionUser() {
  return useContext(SessionUserContext);
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null);
      setEmail(data.session?.user?.email || null);
      syncAuthCookies(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      setEmail(session?.user?.email || null);
      syncAuthCookies(session ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ userId, email, loading }), [userId, email, loading]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SessionUserContext.Provider value={value}>{children}</SessionUserContext.Provider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
