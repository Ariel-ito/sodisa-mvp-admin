'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getTokenExp, clearToken } from '@/lib/auth';
import { hydrateToken } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

const INACTIVITY_MS = 30 * 60 * 1000; // 30 min
const REFRESH_LEAD  = 60 * 1000;       // refrescar 1 min antes del vencimiento

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated]       = useState(false);
  const router          = useRouter();
  const inactivityRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doLogout = useCallback(async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    clearToken();
    router.push('/login');
  }, [router]);

  const resetInactivity = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(doLogout, INACTIVITY_MS);
  }, [doLogout]);

  const scheduleRefresh = useCallback((accessToken: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const exp   = getTokenExp(accessToken);
    if (!exp) return;
    const delay = Math.max(0, exp - Date.now() - REFRESH_LEAD);
    refreshTimerRef.current = setTimeout(async () => {
      const data = await hydrateToken();
      if (!data) { doLogout(); return; }
      scheduleRefresh(data.accessToken);
    }, delay);
  }, [doLogout]);

  // Hidratación inicial + inactivity timer
  useEffect(() => {
    hydrateToken().then((data) => {
      if (!data) { router.push('/login'); return; }
      scheduleRefresh(data.accessToken);
      setHydrated(true);
    });

    resetInactivity();
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, resetInactivity));

    return () => {
      if (inactivityRef.current)   clearTimeout(inactivityRef.current);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      events.forEach(e => window.removeEventListener(e, resetInactivity));
    };
  }, [doLogout, resetInactivity, scheduleRefresh, router]);

  // Detectar cuando el usuario vuelve a la pestaña con token vencido
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState !== 'visible') return;
      const token = getToken();
      const exp   = token ? getTokenExp(token) : null;
      if (!exp || exp <= Date.now()) {
        hydrateToken().then(data => {
          if (!data) doLogout();
          else scheduleRefresh(data.accessToken);
        });
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [doLogout, scheduleRefresh]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 pb-[100px] md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
