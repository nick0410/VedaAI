'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from './Avatar';

const NAV_TOP = [
  { href: '/home', label: 'Home', icon: HomeIcon },
  { href: '/groups', label: 'My Groups', icon: GroupsIcon },
  { href: '/', label: 'Assignments', icon: ClipboardIcon, match: (p: string) => p === '/' || p.startsWith('/create') || p.startsWith('/output') },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: SparkleIcon },
  { href: '/library', label: 'My Library', icon: BookIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="hidden lg:flex h-screen w-64 shrink-0 flex-col bg-ink-50 border-r border-line sticky top-0">
      <div className="px-5 pt-5 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-semibold text-ink-900">VedaAI</span>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <Link href="/create" className="btn-brand w-full">
          <PlusIcon className="h-4 w-4" />
          Create Assignment
        </Link>
      </div>

      <nav className="px-3 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {NAV_TOP.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link href={item.href} className={`nav-item ${active ? 'nav-item-active' : ''}`}>
                  <Icon className="h-4 w-4 text-ink-500" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 px-3 text-[11px] uppercase tracking-wider text-ink-400">Settings</div>
        <ul className="mt-2 space-y-1">
          <li>
            <Link
              href="/settings"
              className={`nav-item ${pathname.startsWith('/settings') ? 'nav-item-active' : ''}`}
            >
              <GearIcon className="h-4 w-4 text-ink-500" />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>

      {user && (
        <Link
          href="/settings"
          className="m-3 rounded-xl border border-line p-3 flex items-center gap-3 hover:bg-ink-50 transition"
        >
          <Avatar src={user.avatarDataUrl} name={user.name} size={36} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">{user.schoolName}</p>
            {user.schoolLocation && (
              <p className="text-xs text-ink-500 truncate">{user.schoolLocation}</p>
            )}
          </div>
        </Link>
      )}
    </aside>
  );
}

function LogoMark() {
  return (
    <div className="h-7 w-7 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow-cta">
      V
    </div>
  );
}
function HomeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5Z" />
    </svg>
  );
}
function GroupsIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M2 20c0-3 3-5 7-5s7 2 7 5" />
      <path d="M15.5 20c0-2 2-3.5 4.5-3.5 1 0 1.8.2 2 .4" />
    </svg>
  );
}
function ClipboardIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="M9 11h6M9 15h4" />
    </svg>
  );
}
function SparkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
    </svg>
  );
}
function BookIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}
function GearIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12c0 .7-.1 1.3-.3 1.9l2.1 1.6-2 3.4-2.4-1a7.4 7.4 0 0 1-3.3 1.9L13 22h-4l-.1-2.2a7.4 7.4 0 0 1-3.3-1.9l-2.4 1-2-3.4 2.1-1.6A7.5 7.5 0 0 1 3 12c0-.7.1-1.3.3-1.9L1.2 8.5l2-3.4 2.4 1a7.4 7.4 0 0 1 3.3-1.9L9 2h4l.1 2.2a7.4 7.4 0 0 1 3.3 1.9l2.4-1 2 3.4-2.1 1.6c.2.6.3 1.2.3 1.9Z" />
    </svg>
  );
}
function PlusIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
