'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { listAssignments, AssignmentSummary } from '@/lib/api';
import { Avatar } from './Avatar';
import { ThemeToggle } from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

const dropdown = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } },
};

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;
  onOpenMenu?: () => void;
}

export function Topbar({ title, subtitle, backHref, onOpenMenu }: Props) {
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<AssignmentSummary[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // load recent assignments to use as notification feed
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await listAssignments();
        if (!cancelled) setNotifs(list.slice(0, 5));
      } catch {
        /* silent */
      }
    };
    load();
    const t = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function onLogout() {
    clear();
    router.replace('/login');
  }

  const unreadCount = notifs.filter((n) => n.status === 'queued' || n.status === 'processing' || n.status === 'failed').length;

  return (
    <header className="sticky top-0 z-20 bg-page/80 backdrop-blur border-b border-line">
      <div className="flex items-center justify-between px-4 sm:px-8 h-16">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onOpenMenu && (
            <button
              className="lg:hidden h-8 w-8 rounded-full border border-ink-200 bg-ink-50 flex items-center justify-center text-ink-700 hover:bg-ink-100"
              onClick={onOpenMenu}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {backHref && (
            <Link
              href={backHref}
              className="h-8 w-8 rounded-full border border-ink-200 bg-ink-50 flex items-center justify-center text-ink-700 hover:bg-ink-100"
              aria-label="Back"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-ink-900 truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-ink-500 truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen((v) => !v);
                setMenuOpen(false);
              }}
              className="btn-icon relative"
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" />
                <path d="M10 21a2 2 0 0 0 4 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-brand-500 text-[10px] font-semibold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  variants={dropdown}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-xl border border-line bg-ink-50 shadow-card overflow-hidden z-30 origin-top-right"
                >
                  <div className="px-4 py-3 border-b border-line">
                    <p className="text-sm font-semibold text-ink-900">Recent activity</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-ink-500 text-center">Nothing here yet.</p>
                    ) : (
                      notifs.map((n) => (
                        <Link
                          key={n.id}
                          href={`/output/${n.id}`}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-ink-50 transition border-b border-line last:border-0"
                          onClick={() => setNotifOpen(false)}
                        >
                          <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dotColor(n.status)}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink-900 truncate">{n.title}</p>
                            <p className="text-xs text-ink-500">
                              {labelFor(n.status)} · {timeAgo(n.createdAt)}
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div className="relative pl-3 border-l border-line" ref={menuRef}>
            <button
              onClick={() => {
                setMenuOpen((v) => !v);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 hover:bg-ink-100 rounded-lg pr-2 py-1 transition"
            >
              {user ? (
                <Avatar src={user.avatarDataUrl} name={user.name} size={32} />
              ) : (
                <div className="h-8 w-8 rounded-full bg-ink-200" />
              )}
              <div className="hidden sm:block leading-tight text-left">
                <p className="text-sm font-medium text-ink-900 truncate max-w-[10rem]">{user?.name ?? 'You'}</p>
                <p className="text-[11px] text-ink-500 capitalize">{user?.role ?? 'teacher'}</p>
              </div>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  variants={dropdown}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-ink-50 shadow-card overflow-hidden z-30 origin-top-right"
                >
                  <div className="px-4 py-3 border-b border-line">
                    <p className="text-sm font-medium text-ink-900 truncate">{user?.name}</p>
                    <p className="text-xs text-ink-500 truncate">{user?.email}</p>
                  </div>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-ink-800 hover:bg-ink-50" onClick={() => setMenuOpen(false)}>
                    Profile & Settings
                  </Link>
                  <Link href="/library" className="block px-4 py-2 text-sm text-ink-800 hover:bg-ink-50" onClick={() => setMenuOpen(false)}>
                    My Library
                  </Link>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-line"
                  >
                    Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

function dotColor(s: AssignmentSummary['status']): string {
  switch (s) {
    case 'completed':
      return 'bg-emerald-500';
    case 'processing':
    case 'queued':
      return 'bg-brand-500';
    case 'failed':
      return 'bg-red-500';
  }
}
function labelFor(s: AssignmentSummary['status']): string {
  return s === 'completed' ? 'Ready' : s === 'processing' ? 'Generating' : s === 'queued' ? 'Queued' : 'Failed';
}
function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
