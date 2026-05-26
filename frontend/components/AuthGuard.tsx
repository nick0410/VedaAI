'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { fetchMe } from '@/lib/api';

interface Props {
  children: React.ReactNode;
}

export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const { token, user, hydrated, setUser, clear } = useAuthStore();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const fresh = await fetchMe();
        if (cancelled) return;
        setUser(fresh);
        setVerified(true);
      } catch {
        if (cancelled) return;
        clear();
        router.replace('/login');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token, router, setUser, clear]);

  if (!hydrated || !token || !user || !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-3 text-ink-500">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-4 border-ink-200" />
            <div className="absolute inset-0 rounded-full border-4 border-ink-900 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm">Loading workspace…</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
