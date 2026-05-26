'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { StaggerDiv, StaggerItem } from '@/components/Stagger';
import { listGroups, createGroup, deleteGroup, type Group } from '@/lib/api';

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const g = await listGroups();
      setGroups(g);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !grade.trim()) {
      setError('Group name and grade are required');
      return;
    }
    setBusy(true);
    try {
      await createGroup({ name: name.trim(), grade: grade.trim() });
      setName('');
      setGrade('');
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string, title: string) {
    if (!confirm(`Delete group "${title}"? Students and assignment links will be removed.`)) return;
    try {
      await deleteGroup(id);
      await refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <AppShell title="My Groups" subtitle="Organize your classes, track attendance, and assign papers.">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Create form */}
        <form onSubmit={onCreate} className="surface p-5 space-y-4 lg:col-span-1 h-fit">
          <h2 className="font-semibold">Create group</h2>
          <div>
            <label className="field-label">Name</label>
            <input
              className="field-input mt-1.5"
              placeholder="e.g. Section A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Grade / Class</label>
            <input
              className="field-input mt-1.5"
              placeholder="e.g. Class X"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" className="btn-dark w-full" disabled={busy}>
            {busy ? 'Creating…' : '+ Add Group'}
          </button>
        </form>

        {/* List */}
        <div className="lg:col-span-2">
          {groups === null ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="surface p-5 h-32 animate-pulse" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="surface p-10 text-center text-sm text-ink-500">
              No groups yet. Create your first one on the left.
            </div>
          ) : (
            <StaggerDiv className="grid sm:grid-cols-2 gap-4">
              {groups.map((g) => {
                const avg =
                  g.students.length === 0
                    ? null
                    : Math.round(
                        (g.students.reduce((s, st) => s + st.attendancePercent, 0) /
                          g.students.length) *
                          10
                      ) / 10;
                return (
                  <StaggerItem key={g.id}>
                    <div className="surface p-5 hover:shadow-card transition relative group">
                      <button
                        onClick={() => onDelete(g.id, g.name)}
                        className="absolute top-3 right-3 text-ink-400 hover:text-red-600 text-base opacity-0 group-hover:opacity-100 transition"
                        aria-label="Delete group"
                      >
                        ×
                      </button>
                      <Link href={`/groups/${g.id}`} className="block">
                        <h3 className="font-semibold text-ink-900">{g.name}</h3>
                        <p className="text-xs text-ink-500 mt-0.5">{g.grade}</p>
                        <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-line text-xs">
                          <Metric label="Students" value={String(g.students.length)} />
                          <Metric
                            label="Avg attend."
                            value={avg === null ? '—' : `${avg}%`}
                            tone={avg === null ? undefined : avg >= 75 ? 'good' : avg >= 60 ? 'warn' : 'bad'}
                          />
                          <Metric label="Papers" value={String(g.assignedAssignments.length)} />
                        </div>
                        <p className="mt-3 text-xs font-medium text-ink-700">Manage →</p>
                      </Link>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerDiv>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const cls =
    tone === 'good'
      ? 'text-emerald-700'
      : tone === 'warn'
      ? 'text-amber-700'
      : tone === 'bad'
      ? 'text-red-700'
      : 'text-ink-900';
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`mt-0.5 font-semibold ${cls}`}>{value}</p>
    </div>
  );
}
