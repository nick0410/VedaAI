'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/store/authStore';
import { listAssignments, AssignmentSummary } from '@/lib/api';

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<AssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listAssignments();
        if (!cancelled) setItems(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const ready = items.filter((i) => i.status === 'completed').length;
    const working = items.filter((i) => i.status === 'queued' || i.status === 'processing').length;
    const failed = items.filter((i) => i.status === 'failed').length;
    const totalMarks = items.reduce(
      (s, i) => s + i.questionTypes.reduce((a, q) => a + q.count * q.marks, 0),
      0
    );
    return { total, ready, working, failed, totalMarks };
  }, [items]);

  const recent = items.slice(0, 5);

  return (
    <AppShell
      title={`Welcome${user ? `, ${user.name.split(' ')[0]}` : ''}`}
      subtitle="Here's a quick look at your workspace."
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Assignments" value={loading ? '—' : stats.total} />
        <StatCard label="Ready" value={loading ? '—' : stats.ready} tone="emerald" />
        <StatCard label="In Progress" value={loading ? '—' : stats.working} tone="brand" />
        <StatCard label="Total Marks Drafted" value={loading ? '—' : stats.totalMarks} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent */}
        <div className="surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent assignments</h2>
            <Link href="/" className="text-xs text-ink-500 hover:text-ink-900">
              View all →
            </Link>
          </div>
          {loading ? (
            <Skeleton />
          ) : recent.length === 0 ? (
            <p className="text-sm text-ink-500">You haven&apos;t created any assignments yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/output/${a.id}`}
                    className="flex items-center justify-between py-3 hover:bg-ink-50 -mx-2 px-2 rounded"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{a.title}</p>
                      <p className="text-xs text-ink-500">{a.subject ?? 'No subject'}</p>
                    </div>
                    <span className={`pill ${pillCls(a.status)}`}>{statusLabel(a.status)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="surface p-5">
            <h3 className="font-semibold mb-3">Quick start</h3>
            <Link href="/create" className="btn-dark w-full">
              + New Assignment
            </Link>
            <Link href="/library" className="btn-outline w-full mt-2">
              Browse My Library
            </Link>
          </div>
          <div className="surface p-5">
            <h3 className="font-semibold mb-1">Pro tip</h3>
            <p className="text-sm text-ink-500">
              Upload a reference document on the Create page — the AI will base questions on your material instead of inventing topics.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  tone = 'ink',
}: {
  label: string;
  value: number | string;
  tone?: 'ink' | 'brand' | 'emerald';
}) {
  const map = {
    ink: 'text-ink-900',
    brand: 'text-brand-600',
    emerald: 'text-emerald-600',
  } as const;
  return (
    <div className="surface p-5">
      <p className="text-xs uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${map[tone]}`}>{value}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-12 rounded bg-ink-100 animate-pulse" />
      ))}
    </div>
  );
}

function pillCls(s: AssignmentSummary['status']) {
  return s === 'completed'
    ? 'bg-emerald-50 text-emerald-700'
    : s === 'processing' || s === 'queued'
    ? 'bg-brand-50 text-brand-700'
    : 'bg-red-50 text-red-700';
}
function statusLabel(s: AssignmentSummary['status']) {
  return s === 'completed' ? 'Ready' : s === 'queued' ? 'Queued' : s === 'processing' ? 'Generating' : 'Failed';
}
