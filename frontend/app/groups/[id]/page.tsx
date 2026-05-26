'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import {
  getGroup,
  addStudents,
  updateStudent,
  removeStudent,
  assignAssignmentToGroup,
  unassignAssignmentFromGroup,
  listAssignments,
  type Group,
  type StudentRow,
  type StudentInput,
  type AssignmentSummary,
} from '@/lib/api';
import { parseStudentsCsv } from '@/lib/csv';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const g = await getGroup(id);
      setGroup(g);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (error) {
    return (
      <AppShell title="Group" backHref="/groups">
        <div className="surface p-10 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <Link href="/groups" className="btn-outline mt-4 inline-flex">
            ← Back to groups
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell title="Loading…" backHref="/groups">
        <div className="surface p-10 animate-pulse h-40" />
      </AppShell>
    );
  }

  const avgAttendance =
    group.students.length === 0
      ? null
      : Math.round((group.students.reduce((s, st) => s + st.attendancePercent, 0) / group.students.length) * 10) / 10;

  return (
    <AppShell title={group.name} subtitle={group.grade} backHref="/groups">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatBlock label="Students" value={String(group.students.length)} />
          <StatBlock
            label="Average attendance"
            value={avgAttendance === null ? '—' : `${avgAttendance}%`}
            tone={avgAttendance === null ? undefined : avgAttendance >= 75 ? 'good' : avgAttendance >= 60 ? 'warn' : 'bad'}
          />
          <StatBlock label="Papers assigned" value={String(group.assignedAssignments.length)} />
        </div>

        <StudentsSection group={group} onChange={refresh} />
        <AssignmentsSection group={group} onChange={refresh} />
      </div>
    </AppShell>
  );
}

function StatBlock({
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
      ? 'text-emerald-600'
      : tone === 'warn'
      ? 'text-amber-600'
      : tone === 'bad'
      ? 'text-red-600'
      : 'text-ink-900';
  return (
    <div className="surface p-5">
      <p className="text-xs uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${cls}`}>{value}</p>
    </div>
  );
}

// ============================================================================
// STUDENTS
// ============================================================================

function StudentsSection({ group, onChange }: { group: Group; onChange: () => Promise<void> }) {
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');

  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-semibold">Students</h2>
          <p className="text-xs text-ink-500">Add manually or import from a CSV file.</p>
        </div>
        <div className="inline-flex rounded-lg bg-ink-100 p-1 text-xs">
          <button
            onClick={() => setMode('manual')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              mode === 'manual' ? 'bg-ink-50 text-ink-900 shadow-card' : 'text-ink-600'
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setMode('csv')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              mode === 'csv' ? 'bg-ink-50 text-ink-900 shadow-card' : 'text-ink-600'
            }`}
          >
            CSV upload
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'manual' ? (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <ManualAddForm groupId={group.id} onChange={onChange} />
          </motion.div>
        ) : (
          <motion.div
            key="csv"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <CsvUpload groupId={group.id} onChange={onChange} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 -mx-2 sm:mx-0 overflow-x-auto">
        <StudentsTable group={group} onChange={onChange} />
      </div>
    </section>
  );
}

function ManualAddForm({ groupId, onChange }: { groupId: string; onChange: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [att, setAtt] = useState(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !rollNumber.trim()) {
      setError('Name and roll number are required');
      return;
    }
    if (att < 0 || att > 100) {
      setError('Attendance must be between 0 and 100');
      return;
    }
    setBusy(true);
    try {
      const r = await addStudents(groupId, [
        { name: name.trim(), rollNumber: rollNumber.trim(), attendancePercent: att },
      ]);
      if (r.skippedDuplicates > 0) {
        setError(`Roll number already exists — student not added.`);
      } else {
        setName('');
        setRollNumber('');
        setAtt(100);
      }
      await onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
      <div className="sm:col-span-5">
        <label className="field-label">Name</label>
        <input
          className="field-input mt-1.5"
          placeholder="e.g. Anita Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="sm:col-span-3">
        <label className="field-label">Roll No.</label>
        <input
          className="field-input mt-1.5"
          placeholder="e.g. 01"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">Attendance %</label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          className="field-input mt-1.5"
          value={att}
          onChange={(e) => setAtt(Number(e.target.value || 0))}
        />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-dark w-full" disabled={busy}>
          {busy ? 'Adding…' : '+ Add'}
        </button>
      </div>
      {error && (
        <p className="sm:col-span-12 text-xs text-red-600 -mt-1">{error}</p>
      )}
    </form>
  );
}

function CsvUpload({ groupId, onChange }: { groupId: string; onChange: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<StudentInput[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setResult(null);
    setErrors([]);
    setPreview([]);
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();
    const parsed = parseStudentsCsv(text);
    setPreview(parsed.students);
    setErrors(parsed.errors);
  }

  async function onImport() {
    if (preview.length === 0) return;
    setImporting(true);
    try {
      const r = await addStudents(groupId, preview);
      setResult({ added: r.added, skipped: r.skippedDuplicates });
      setPreview([]);
      setFileName(null);
      if (fileRef.current) fileRef.current.value = '';
      await onChange();
    } catch (e) {
      setErrors([(e as Error).message]);
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob(
      ['name,rollNumber,attendancePercent\nAnita Sharma,01,92.5\nRahul Kumar,02,88.0\n'],
      { type: 'text/csv' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-ink-200 bg-ink-50/40 px-4 py-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink-700 truncate">
            {fileName ? <span className="font-medium">{fileName}</span> : 'Pick a CSV with columns: name, rollNumber, attendancePercent'}
          </p>
          <p className="text-xs text-ink-500 mt-0.5">Headers are auto-detected. Comma-separated.</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onPick}
          className="hidden"
        />
        <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
          Choose CSV
        </button>
        <button type="button" className="text-xs text-ink-700 hover:text-ink-900 underline underline-offset-2" onClick={downloadTemplate}>
          Download template
        </button>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-0.5 max-h-32 overflow-auto">
          {errors.slice(0, 8).map((e, i) => (
            <p key={i}>· {e}</p>
          ))}
          {errors.length > 8 && <p>… and {errors.length - 8} more</p>}
        </div>
      )}

      {preview.length > 0 && (
        <div className="rounded-lg border border-line bg-ink-50">
          <div className="px-4 py-2 border-b border-line flex items-center justify-between">
            <p className="text-xs font-medium text-ink-700">
              Preview · {preview.length} row{preview.length === 1 ? '' : 's'}
            </p>
            <button onClick={onImport} className="btn-dark" disabled={importing}>
              {importing ? 'Importing…' : `Import ${preview.length} students`}
            </button>
          </div>
          <div className="max-h-64 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Roll</th>
                  <th className="text-right px-4 py-2">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {preview.slice(0, 50).map((s, i) => (
                  <tr key={i}>
                    <td className="px-4 py-1.5">{s.name}</td>
                    <td className="px-4 py-1.5">{s.rollNumber}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">{s.attendancePercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <p className="text-xs text-emerald-700">
          ✓ Added {result.added} student{result.added === 1 ? '' : 's'}
          {result.skipped > 0 ? ` · skipped ${result.skipped} duplicate(s)` : ''}.
        </p>
      )}
    </div>
  );
}

function StudentsTable({ group, onChange }: { group: Group; onChange: () => Promise<void> }) {
  if (group.students.length === 0) {
    return (
      <p className="text-sm text-ink-500 px-2 py-6 text-center">
        No students yet — add some using the form above.
      </p>
    );
  }
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-[11px] uppercase tracking-wider text-ink-500 border-b border-line">
          <th className="text-left px-2 py-2 w-12">#</th>
          <th className="text-left px-2 py-2">Name</th>
          <th className="text-left px-2 py-2">Roll No.</th>
          <th className="text-left px-2 py-2 w-40">Attendance</th>
          <th className="w-10" />
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {group.students.map((s, idx) => (
          <StudentRowComp
            key={s.id}
            index={idx + 1}
            student={s}
            groupId={group.id}
            onChange={onChange}
          />
        ))}
      </tbody>
    </table>
  );
}

function StudentRowComp({
  index,
  student,
  groupId,
  onChange,
}: {
  index: number;
  student: StudentRow;
  groupId: string;
  onChange: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.name);
  const [rollNumber, setRollNumber] = useState(student.rollNumber);
  const [att, setAtt] = useState(student.attendancePercent);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await updateStudent(groupId, student.id, { name, rollNumber, attendancePercent: att });
      setEditing(false);
      await onChange();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove ${student.name}?`)) return;
    setBusy(true);
    try {
      await removeStudent(groupId, student.id);
      await onChange();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <tr className="bg-ink-50/50">
        <td className="px-2 py-2 text-ink-500 tabular-nums">{index}</td>
        <td className="px-2 py-2">
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
        </td>
        <td className="px-2 py-2">
          <input className="field-input" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
        </td>
        <td className="px-2 py-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              className="field-input w-20"
              value={att}
              onChange={(e) => setAtt(Number(e.target.value || 0))}
            />
            <span className="text-xs text-ink-500">%</span>
          </div>
        </td>
        <td className="px-2 py-2">
          <div className="flex gap-1 justify-end">
            <button onClick={save} disabled={busy} className="text-xs font-medium text-ink-900 hover:underline">
              Save
            </button>
            <button onClick={() => setEditing(false)} disabled={busy} className="text-xs text-ink-500 hover:underline">
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group hover:bg-ink-50/50 transition">
      <td className="px-2 py-2.5 text-ink-500 tabular-nums">{index}</td>
      <td className="px-2 py-2.5 font-medium text-ink-900">{student.name}</td>
      <td className="px-2 py-2.5 text-ink-700 tabular-nums">{student.rollNumber}</td>
      <td className="px-2 py-2.5">
        <AttendanceBar value={student.attendancePercent} />
      </td>
      <td className="px-2 py-2.5">
        <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-ink-700 hover:text-ink-900">
            Edit
          </button>
          <button onClick={remove} className="text-xs font-medium text-red-600 hover:text-red-700">
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
}

function AttendanceBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const tone = v >= 75 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 max-w-[8rem] h-1.5 rounded-full bg-ink-100 overflow-hidden">
        <div className={`h-full ${tone} transition-all`} style={{ width: `${v}%` }} />
      </div>
      <span className="text-xs font-medium text-ink-700 tabular-nums">{v}%</span>
    </div>
  );
}

// ============================================================================
// ASSIGNMENTS
// ============================================================================

function AssignmentsSection({ group, onChange }: { group: Group; onChange: () => Promise<void> }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  async function unassign(aid: string) {
    if (!confirm('Remove this paper from the group?')) return;
    try {
      await unassignAssignmentFromGroup(group.id, aid);
      await onChange();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-semibold">Assigned papers</h2>
          <p className="text-xs text-ink-500">Pick from the assignments you have already generated.</p>
        </div>
        <button onClick={() => setPickerOpen(true)} className="btn-dark">
          + Assign paper
        </button>
      </div>

      {group.assignedAssignments.length === 0 ? (
        <p className="text-sm text-ink-500 px-2 py-6 text-center">
          No papers assigned to this group yet.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {group.assignedAssignments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 truncate">{a.title ?? 'Untitled paper'}</p>
                <p className="text-xs text-ink-500 truncate">
                  {a.subject ?? '—'}
                  {a.dueDate && ` · Due ${new Date(a.dueDate).toLocaleDateString()}`}
                  {a.status && ` · ${a.status}`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/output/${a.id}`} className="text-xs font-medium text-ink-700 hover:text-ink-900">
                  Open
                </Link>
                <button onClick={() => unassign(a.id)} className="text-xs font-medium text-red-600 hover:text-red-700">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {pickerOpen && (
          <AssignmentPicker
            group={group}
            onClose={() => setPickerOpen(false)}
            onAssigned={async () => {
              await onChange();
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function AssignmentPicker({
  group,
  onClose,
  onAssigned,
}: {
  group: Group;
  onClose: () => void;
  onAssigned: () => Promise<void>;
}) {
  const [items, setItems] = useState<AssignmentSummary[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listAssignments().then(setItems).catch(() => setItems([]));
  }, []);

  const assignedIds = new Set(group.assignedAssignments.map((a) => a.id));
  const visible = (items ?? []).filter((a) => {
    const q = search.trim().toLowerCase();
    return !q || a.title.toLowerCase().includes(q) || (a.subject ?? '').toLowerCase().includes(q);
  });

  async function assign(aid: string) {
    setBusyId(aid);
    try {
      await assignAssignmentToGroup(group.id, aid);
      await onAssigned();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <motion.div
      key="picker-modal"
      className="fixed inset-0 z-40 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-ink-50 rounded-card shadow-card max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
        initial={{ y: 16, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 12, scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-ink-900">Assign a paper to {group.name}</h3>
            <p className="text-xs text-ink-500">Choose from your existing assignments.</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 text-lg">×</button>
        </header>
        <div className="px-5 py-3 border-b border-line">
          <input
            className="field-input"
            placeholder="Search by title or subject"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {items === null ? (
            <div className="p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-ink-100 animate-pulse rounded mb-2" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <p className="p-10 text-center text-sm text-ink-500">
              {items.length === 0
                ? 'You don’t have any assignments yet. Create one first.'
                : 'No matching assignments.'}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((a) => {
                const already = assignedIds.has(a.id);
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-ink-50 transition">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{a.title}</p>
                      <p className="text-xs text-ink-500">{a.subject ?? '—'} · {a.status}</p>
                    </div>
                    {already ? (
                      <span className="pill bg-emerald-50 text-emerald-700">Assigned</span>
                    ) : (
                      <button
                        onClick={() => assign(a.id)}
                        disabled={busyId === a.id}
                        className="btn-outline text-xs"
                      >
                        {busyId === a.id ? 'Assigning…' : 'Assign'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
