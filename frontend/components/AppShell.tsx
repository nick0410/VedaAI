'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AuthGuard } from './AuthGuard';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileDrawer } from './MobileDrawer';

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;
  children: React.ReactNode;
}

export function AppShell({ title, subtitle, backHref, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <AuthGuard>
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar
            title={title}
            subtitle={subtitle}
            backHref={backHref}
            onOpenMenu={() => setDrawerOpen(true)}
          />
          <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">{children}</main>
        </div>
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
