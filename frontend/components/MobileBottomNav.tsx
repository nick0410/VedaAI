'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const TABS: {
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon: (cls: string) => React.ReactNode;
}[] = [
  {
    href: '/home',
    label: 'Home',
    match: (p) => p === '/home',
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5Z" />
      </svg>
    ),
  },
  {
    href: '/',
    label: 'Assignments',
    match: (p) => p === '/' || p.startsWith('/output'),
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="4" width="12" height="17" rx="2" />
        <path d="M9 4h6v3H9z" />
        <path d="M9 11h6M9 15h4" />
      </svg>
    ),
  },
  {
    href: '/library',
    label: 'Library',
    match: (p) => p.startsWith('/library'),
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z" />
        <path d="M8 7h8M8 11h8M8 15h5" />
      </svg>
    ),
  },
  {
    href: '/groups',
    label: 'Groups',
    match: (p) => p.startsWith('/groups'),
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.5" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M2 20c0-3 3-5 7-5s7 2 7 5" />
        <path d="M15.5 20c0-2 2-3.5 4.5-3.5 1 0 1.8.2 2 .4" />
      </svg>
    ),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="lg:hidden no-print fixed bottom-0 inset-x-0 z-30 border-t border-line bg-ink-50/95 backdrop-blur supports-[backdrop-filter]:bg-ink-50/80"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative grid grid-cols-4 max-w-md mx-auto">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[10px] font-medium"
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute -top-px left-6 right-6 h-0.5 rounded-b bg-ink-900"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className={active ? 'text-ink-900' : 'text-ink-500'}>
                {t.icon('h-5 w-5')}
              </span>
              <span className={active ? 'text-ink-900' : 'text-ink-500'}>{t.label}</span>
            </Link>
          );
        })}

        {/* Floating add button */}
        <Link
          href="/create"
          className="absolute -top-7 right-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 text-white shadow-cta ring-1 ring-brand-500/40 hover:from-zinc-700 hover:to-zinc-900 transition"
          aria-label="Create assignment"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
