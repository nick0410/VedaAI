'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { AssignmentSummary } from '@/lib/api';
import { deleteAssignment } from '@/lib/api';

interface Props {
  item: AssignmentSummary;
  onDeleted: () => void;
}

export function AssignmentCard({ item, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete "${item.title}"?`)) return;
    setBusy(true);
    try {
      await deleteAssignment(item.id);
      onDeleted();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="surface p-4 flex flex-col gap-3 relative hover:shadow-card transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dotColor(item.status)}`} />
          <h3 className="font-medium text-ink-900 leading-snug truncate">{item.title}</h3>
        </div>

        <div className="relative shrink-0">
          <button
            className="h-7 w-7 rounded-md text-ink-500 hover:bg-ink-100 flex items-center justify-center"
            onClick={() => setOpen((v) => !v)}
            aria-label="Card menu"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <circle cx="5" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="19" cy="12" r="1.6" />
            </svg>
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-line bg-ink-50 shadow-card overflow-hidden">
                <Link
                  href={`/output/${item.id}`}
                  className="block px-3 py-2 text-sm text-ink-800 hover:bg-ink-50"
                >
                  View Assignment
                </Link>
                <button
                  onClick={onDelete}
                  disabled={busy}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="text-xs text-ink-500 space-y-0.5">
        <p>
          Assigned on <span className="text-ink-700 font-medium">{formatDate(item.createdAt)}</span>
        </p>
        <p>
          Due <span className="text-ink-700 font-medium">{formatDate(item.dueDate)}</span>
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-line">
        <StatusPill status={item.status} />
        <Link href={`/output/${item.id}`} className="text-xs font-medium text-ink-700 hover:text-ink-900">
          Open →
        </Link>
      </div>
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = date.getFullYear();
  return `${dd}-${mm}-${yy}`;
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

function StatusPill({ status }: { status: AssignmentSummary['status'] }) {
  const map = {
    queued: { label: 'Queued', cls: 'bg-amber-50 text-amber-700' },
    processing: { label: 'Generating…', cls: 'bg-brand-50 text-brand-700' },
    completed: { label: 'Ready', cls: 'bg-emerald-50 text-emerald-700' },
    failed: { label: 'Failed', cls: 'bg-red-50 text-red-700' },
  } as const;
  const v = map[status];
  return <span className={`pill ${v.cls}`}>{v.label}</span>;
}
