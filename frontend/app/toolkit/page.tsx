'use client';

import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

interface Tool {
  title: string;
  description: string;
  href: string;
  available: boolean;
  icon: (cls: string) => React.ReactNode;
}

const TOOLS: Tool[] = [
  {
    title: 'AI Assessment Creator',
    description: 'Generate a structured question paper from a brief, with sections, difficulty, and marks.',
    href: '/create',
    available: true,
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <path d="M9 7h6M9 11h6M9 15h3" />
      </svg>
    ),
  },
  {
    title: 'My Library',
    description: 'Browse, reuse and download the question papers you have already generated.',
    href: '/library',
    available: true,
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z" />
        <path d="M8 7h8M8 11h8M8 15h5" />
      </svg>
    ),
  },
  {
    title: 'Rubric Builder',
    description: 'Define marking criteria and rubrics for descriptive answers. Coming soon.',
    href: '#',
    available: false,
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    title: 'Plagiarism Check',
    description: 'Detect similarity between submitted answers and known sources. Coming soon.',
    href: '#',
    available: false,
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    title: 'Answer Key Generator',
    description: 'Produce model answers and grading guidelines for any generated paper. Coming soon.',
    href: '#',
    available: false,
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    title: 'Lesson Planner',
    description: 'Outline lessons aligned with your generated assessments. Coming soon.',
    href: '#',
    available: false,
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
];

export default function ToolkitPage() {
  return (
    <AppShell title="AI Teacher's Toolkit" subtitle="Everything your classroom needs, in one place.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((t) => {
          const inner = (
            <>
              <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
                {t.icon('h-5 w-5')}
              </div>
              <h3 className="font-semibold text-ink-900">{t.title}</h3>
              <p className="text-sm text-ink-500 mt-1 leading-relaxed">{t.description}</p>
              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                <span className={`pill ${t.available ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}>
                  {t.available ? 'Available' : 'Coming soon'}
                </span>
                {t.available && <span className="text-xs font-medium text-ink-700">Open →</span>}
              </div>
            </>
          );
          return t.available ? (
            <Link key={t.title} href={t.href} className="surface p-5 hover:shadow-card transition block">
              {inner}
            </Link>
          ) : (
            <div key={t.title} className="surface p-5 opacity-70">{inner}</div>
          );
        })}
      </div>
    </AppShell>
  );
}
