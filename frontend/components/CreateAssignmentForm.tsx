'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAssignmentStore } from '@/store/assignmentStore';
import { createAssignment } from '@/lib/api';
import type { QuestionType, QuestionTypeSpec } from '@/lib/types';
import { QUESTION_TYPE_LABEL } from '@/lib/types';

const ALL_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple Choice Questions' },
  { value: 'short', label: 'Short Questions' },
  { value: 'long', label: 'Long / Diagram-Based Questions' },
  { value: 'true_false', label: 'True / False' },
];

export function CreateAssignmentForm() {
  const router = useRouter();
  const { draft, setDraft } = useAssignmentStore();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);

  const totalQuestions = useMemo(
    () => draft.questionTypes.reduce((s, q) => s + (q.count || 0), 0),
    [draft.questionTypes]
  );
  const totalMarks = useMemo(
    () => draft.questionTypes.reduce((s, q) => s + (q.count || 0) * (q.marks || 0), 0),
    [draft.questionTypes]
  );

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!draft.title.trim()) e.title = 'Assignment title is required';
    if (!draft.dueDate) e.dueDate = 'Due date is required';
    else if (new Date(draft.dueDate).getTime() < Date.now() - 86400_000)
      e.dueDate = 'Due date cannot be in the past';
    if (draft.questionTypes.length === 0) e.questionTypes = 'Add at least one question type';
    draft.questionTypes.forEach((q, i) => {
      if (q.count <= 0) e[`qt-${i}-count`] = 'Must be > 0';
      if (q.marks <= 0) e[`qt-${i}-marks`] = 'Must be > 0';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const updateType = (idx: number, patch: Partial<QuestionTypeSpec>) => {
    const next = draft.questionTypes.map((q, i) => (i === idx ? { ...q, ...patch } : q));
    setDraft({ questionTypes: next });
  };

  const removeType = (idx: number) =>
    setDraft({ questionTypes: draft.questionTypes.filter((_, i) => i !== idx) });

  const addType = () => {
    const used = new Set(draft.questionTypes.map((q) => q.type));
    const next = ALL_TYPES.find((t) => !used.has(t.value))?.value ?? 'mcq';
    setDraft({
      questionTypes: [...draft.questionTypes, { type: next, count: 5, marks: 2 }],
    });
  };

  const onFiles = useCallback(
    (file: File | null) => {
      setDraft({ file });
    },
    [setDraft]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', draft.title.trim());
      if (draft.subject.trim()) fd.append('subject', draft.subject.trim());
      fd.append('dueDate', new Date(draft.dueDate).toISOString());
      if (draft.instructions.trim()) fd.append('instructions', draft.instructions.trim());
      fd.append('questionTypes', JSON.stringify(draft.questionTypes));
      if (draft.file) fd.append('file', draft.file);

      const { id } = await createAssignment(fd);
      router.push(`/output/${id}`);
    } catch (err) {
      setErrors({ submit: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface p-6 sm:p-8 space-y-8">
      {/* Assignment title (subtle, since the page already has it via Topbar) */}
      <div>
        <label className="field-label">Assignment Title</label>
        <input
          className="field-input mt-1.5"
          placeholder="e.g. Quiz on Electricity"
          value={draft.title}
          onChange={(e) => setDraft({ title: e.target.value })}
        />
        {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
      </div>

      <Section title="Assignment Details" hint="Basic information about your assignment.">
        {/* File upload */}
        <div>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onFiles(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition ${
              dragOver ? 'border-ink-900 bg-ink-50' : 'border-ink-200 bg-ink-50/40 hover:bg-ink-50'
            }`}
          >
            <CloudUploadIcon className="h-7 w-7 text-ink-500" />
            <p className="mt-3 text-sm text-ink-700 font-medium">
              {draft.file ? draft.file.name : 'Choose a file or drag & drop it here'}
            </p>
            <p className="mt-1 text-xs text-ink-500">PDF, DOC, TXT · max 5 MB</p>
            <span className="mt-4 inline-flex items-center justify-center rounded-lg border border-ink-200 bg-ink-50 px-4 py-1.5 text-xs font-medium text-ink-800 hover:bg-ink-100">
              Browse Files
            </span>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx,text/plain,application/pdf"
              className="hidden"
              onChange={(e) => onFiles(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="mt-2 text-xs text-ink-500 text-center">
            Upload images of your preferred document / image (optional)
          </p>
        </div>

        {/* Subject + Due date row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="field-label">Subject (optional)</label>
            <input
              className="field-input mt-1.5"
              placeholder="e.g. English, Class XII"
              value={draft.subject}
              onChange={(e) => setDraft({ subject: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Due Date</label>
            <div className="relative mt-1.5">
              <input
                type="date"
                className="field-input pr-10"
                value={draft.dueDate}
                onChange={(e) => setDraft({ dueDate: e.target.value })}
              />
              <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
            </div>
            {errors.dueDate && <p className="text-xs text-red-600 mt-1">{errors.dueDate}</p>}
          </div>
        </div>
      </Section>

      <Section
        title="Question Types"
        hint="Define the structure of your assessment."
        right={
          <div className="text-right text-xs text-ink-500 leading-tight">
            <p>Total Questions: <span className="font-semibold text-ink-900">{totalQuestions}</span></p>
            <p>Total Marks: <span className="font-semibold text-ink-900">{totalMarks}</span></p>
          </div>
        }
      >
        <div className="space-y-3">
          {/* header row */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-1 text-[11px] uppercase tracking-wider text-ink-500">
            <span className="col-span-6">Question Type</span>
            <span className="col-span-3 text-center">No. of Questions</span>
            <span className="col-span-2 text-center">Marks (each)</span>
            <span className="col-span-1" />
          </div>

          {draft.questionTypes.map((q, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-12 sm:col-span-6">
                <select
                  className="field-input"
                  value={q.type}
                  onChange={(e) => updateType(i, { type: e.target.value as QuestionType })}
                >
                  {ALL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <Stepper
                  value={q.count}
                  min={1}
                  onChange={(v) => updateType(i, { count: v })}
                />
                {errors[`qt-${i}-count`] && (
                  <p className="text-[10px] text-red-600 mt-1 text-center">{errors[`qt-${i}-count`]}</p>
                )}
              </div>
              <div className="col-span-5 sm:col-span-2">
                <Stepper
                  value={q.marks}
                  min={1}
                  onChange={(v) => updateType(i, { marks: v })}
                />
                {errors[`qt-${i}-marks`] && (
                  <p className="text-[10px] text-red-600 mt-1 text-center">{errors[`qt-${i}-marks`]}</p>
                )}
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeType(i)}
                  className="h-8 w-8 rounded-md text-ink-400 hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center"
                  aria-label="Remove row"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {errors.questionTypes && <p className="text-xs text-red-600">{errors.questionTypes}</p>}

          <button
            type="button"
            onClick={addType}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-800 hover:text-brand-600 transition"
            disabled={draft.questionTypes.length >= ALL_TYPES.length}
          >
            <span className="h-5 w-5 rounded-full bg-ink-900 text-white flex items-center justify-center text-xs">+</span>
            Add Question Type
          </button>
        </div>
      </Section>

      <Section
        title="Additional information (for better output)"
        hint="Tone, topic emphasis, formatting preferences…"
      >
        <textarea
          rows={4}
          className="field-input"
          placeholder="e.g. Focus on numerical problems based on Ohm's law. Include 1 graph-interpretation question."
          value={draft.instructions}
          onChange={(e) => setDraft({ instructions: e.target.value })}
        />
      </Section>

      {errors.submit && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {errors.submit}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-line">
        <Link href="/" className="btn-outline">
          ← Previous
        </Link>
        <button type="submit" className="btn-dark" disabled={submitting}>
          {submitting ? 'Creating…' : 'Next →'}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  right,
  children,
}: {
  title: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between mb-4 gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {hint && <p className="text-xs text-ink-500 mt-0.5">{hint}</p>}
        </div>
        {right}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Stepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrement"
      >
        −
      </button>
      <input
        type="number"
        className="w-14 rounded-md border border-ink-200 bg-ink-50 px-2 py-1 text-sm text-center focus:border-ink-900 focus:outline-none"
        value={value}
        min={min}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value || min)))}
      />
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(value + 1)}
        aria-label="Increment"
      >
        +
      </button>
    </div>
  );
}

function CloudUploadIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 18a5 5 0 1 1 .9-9.9 7 7 0 0 1 13.4 2.6A4 4 0 0 1 19 18H7Z" />
      <path d="M12 12v6M9 15l3-3 3 3" />
    </svg>
  );
}
function CalendarIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}
