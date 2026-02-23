'use client';

import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type SessionUserContextValue = { userId: string | null; loading: boolean };
const SessionUserContext = createContext<SessionUserContextValue>({ userId: null, loading: true });

export function useSessionUser() {
  return useContext(SessionUserContext);
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClientComponentClient();

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ userId, loading }), [userId, loading]);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionUserContext.Provider value={value}>{children}</SessionUserContext.Provider>
    </QueryClientProvider>
  );
}
