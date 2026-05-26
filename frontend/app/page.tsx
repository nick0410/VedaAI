'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { AssignmentCard } from '@/components/AssignmentCard';
import { EmptyState } from '@/components/EmptyState';
import { StaggerDiv, StaggerItem } from '@/components/Stagger';
import { listAssignments, AssignmentSummary } from '@/lib/api';

type FilterValue = 'all' | 'queued' | 'processing' | 'completed' | 'failed';

export default function DashboardPage() {
  const [items, setItems] = useState<AssignmentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');

  const refresh = useCallback(async () => {
    try {
      const data = await listAssignments();
      setItems(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchesQ = !q || i.title.toLowerCase().includes(q) || (i.subject ?? '').toLowerCase().includes(q);
      const matchesF = filter === 'all' || i.status === filter;
      return matchesQ && matchesF;
    });
  }, [items, search, filter]);

  return (
    <AppShell title="Assignments" subtitle="Create and review the question papers your AI assistant has prepared.">
      {error && (
        <div className="surface p-4 mb-4 text-sm text-red-700 bg-red-50 border-red-100">
          {error}
        </div>
      )}

      {items === null ? (
        <SkeletonGrid />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterValue)}
              className="field-input sm:max-w-[180px]"
            >
              <option value="all">Filter by — All</option>
              <option value="queued">Queued</option>
              <option value="processing">Generating</option>
              <option value="completed">Ready</option>
              <option value="failed">Failed</option>
            </select>
            <div className="relative flex-1">
              <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                className="field-input pl-9"
                placeholder="Search assignments"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="surface p-10 text-center text-sm text-ink-500">No matching assignments.</div>
          ) : (
            <StaggerDiv className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <StaggerItem key={item.id}>
                  <AssignmentCard item={item} onDeleted={refresh} />
                </StaggerItem>
              ))}
            </StaggerDiv>
          )}

          <div className="mt-8 flex justify-center">
            <Link href="/create" className="btn-dark">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create Assignment
            </Link>
          </div>
        </>
      )}
    </AppShell>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="surface p-4 h-32 animate-pulse">
          <div className="h-3 w-1/2 bg-ink-100 rounded" />
          <div className="mt-3 h-3 w-1/3 bg-ink-100 rounded" />
          <div className="mt-2 h-3 w-1/4 bg-ink-100 rounded" />
        </div>
      ))}
    </div>
  );
}
