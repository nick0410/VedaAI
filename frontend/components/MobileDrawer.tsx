'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from './Avatar';

interface Props {
  open: boolean;
  onClose: () => void;
}

const LINKS = [
  { href: '/home', label: 'Home' },
  { href: '/', label: 'Assignments' },
  { href: '/groups', label: 'My Groups' },
  { href: '/toolkit', label: "AI Teacher's Toolkit" },
  { href: '/library', label: 'My Library' },
  { href: '/settings', label: 'Settings' },
];

export function MobileDrawer({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuthStore();

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function onLogout() {
    clear();
    router.replace('/login');
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="lg:hidden fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-ink-50 border-r border-line flex flex-col"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
          >
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2" onClick={onClose}>
                <span className="h-7 w-7 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow-cta">
                  V
                </span>
                <span className="font-semibold text-ink-900">VedaAI</span>
              </Link>
              <button onClick={onClose} className="text-ink-500 hover:text-ink-900 text-xl leading-none px-2" aria-label="Close menu">
                ×
              </button>
            </div>

            <div className="px-4 pb-4">
              <Link href="/create" onClick={onClose} className="btn-brand w-full">
                + Create Assignment
              </Link>
            </div>

            <nav className="px-3 flex-1 overflow-y-auto">
              <ul className="space-y-1">
                {LINKS.map((l) => {
                  const active =
                    l.href === '/'
                      ? pathname === '/' || pathname.startsWith('/output') || pathname.startsWith('/create')
                      : pathname.startsWith(l.href);
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={onClose}
                        className={`nav-item ${active ? 'nav-item-active' : ''}`}
                      >
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {user && (
              <div className="border-t border-line p-4 space-y-3">
                <Link href="/settings" onClick={onClose} className="flex items-center gap-3 rounded-lg hover:bg-ink-100 p-2 transition">
                  <Avatar src={user.avatarDataUrl} name={user.name} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{user.name}</p>
                    <p className="text-xs text-ink-500 truncate">{user.schoolName}</p>
                  </div>
                </Link>
                <button
                  onClick={onLogout}
                  className="w-full text-left text-sm text-red-600 hover:bg-red-50 rounded-lg px-2 py-2 transition"
                >
                  Log out
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
