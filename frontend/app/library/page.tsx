'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { listAssignments, AssignmentSummary } from '@/lib/api';

export default function LibraryPage() {
  const [items, setItems] = useState<AssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const list = await listAssignments();
        setItems(list.filter((i) => i.status === 'completed'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (i) => i.title.toLowerCase().includes(s) || (i.subject ?? '').toLowerCase().includes(s)
    );
  }, [items, q]);

  return (
    <AppShell title="My Library" subtitle="Completed question papers, ready to reuse and download.">
      <div className="mb-5">
        <input
          className="field-input max-w-md"
          placeholder="Search by title or subject"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-ink-500">
          {items.length === 0 ? 'No completed papers yet. Create one and it will appear here.' : 'No matching papers.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const marks = a.questionTypes.reduce((s, t) => s + t.count * t.marks, 0);
            const qcount = a.questionTypes.reduce((s, t) => s + t.count, 0);
            return (
              <Link key={a.id} href={`/output/${a.id}`} className="surface p-5 hover:shadow-card transition flex flex-col gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink-500">{a.subject ?? 'Untitled subject'}</p>
                  <h3 className="font-medium text-ink-900 leading-snug mt-1">{a.title}</h3>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-line text-xs text-ink-500">
                  <span>{qcount} questions · {marks} marks</span>
                  <span className="text-ink-700 font-medium">Open →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
