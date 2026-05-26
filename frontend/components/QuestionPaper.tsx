'use client';

import { forwardRef } from 'react';
import type { GeneratedPaper, GeneratedQuestion } from '@/lib/types';
import { DifficultyBadge, MarksBadge } from './DifficultyBadge';

interface Props {
  paper: GeneratedPaper;
  dueDate?: string;
  className?: string;
}

export const QuestionPaper = forwardRef<HTMLDivElement, Props>(function QuestionPaper(
  { paper, dueDate, className = '' },
  ref
) {
  const timeAllowed = estimateTime(paper);
  const schoolLine = [paper.school, paper.schoolLocation].filter(Boolean).join(', ') || 'Your School';

  return (
    <div
      ref={ref}
      className={`paper-print bg-white rounded-card border border-line shadow-card ${className} px-6 sm:px-12 py-8 sm:py-12 font-serif text-ink-900`}
    >
      {/* School header */}
      <header className="text-center pb-6 border-b border-ink-300">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{schoolLine}</h1>
        {paper.subject && (
          <p className="mt-1 text-sm sm:text-base text-ink-700">
            <span className="font-semibold">Subject:</span> {paper.subject}
          </p>
        )}
        <p className="text-sm sm:text-base text-ink-700">
          <span className="font-semibold">Assignment:</span> {paper.title}
        </p>
        {paper.teacherName && (
          <p className="mt-1 text-xs sm:text-sm text-ink-500">
            Prepared by: {paper.teacherName}
          </p>
        )}
      </header>

      {/* Meta row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 text-sm py-4 border-b border-dashed border-ink-300">
        <p>
          <span className="font-semibold">Time Allowed:</span> {timeAllowed} minutes
        </p>
        <p className="text-right sm:text-center">
          <span className="font-semibold">Maximum Marks:</span> {paper.totalMarks}
        </p>
        {dueDate && (
          <p className="col-span-2 sm:col-span-1 sm:text-right">
            <span className="font-semibold">Due:</span>{' '}
            {new Date(dueDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Student info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3 py-5 border-b border-dashed border-ink-300 text-sm">
        <StudentField label="Name" />
        <StudentField label="Roll Number" />
        <StudentField label="Section" />
      </div>

      {/* General instructions */}
      <div className="py-5 text-sm">
        <p className="font-semibold mb-1">General Instructions:</p>
        <ol className="list-decimal list-outside pl-5 space-y-1 text-ink-800">
          <li>All questions are compulsory.</li>
          <li>Marks for each question are indicated against it.</li>
          <li>Read each question carefully before attempting.</li>
          <li>Write your answers clearly within the space provided.</li>
        </ol>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {paper.sections.map((section) => (
          <section key={section.id} aria-labelledby={`sec-${section.id}`}>
            <div className="text-center my-2">
              <h2 id={`sec-${section.id}`} className="text-base sm:text-lg font-bold underline underline-offset-4">
                {section.title}
              </h2>
              <p className="text-xs sm:text-sm italic text-ink-600 mt-1">{section.instruction}</p>
            </div>

            <ol className="space-y-5 mt-4">
              {section.questions.map((q, idx) => (
                <li key={q.id} className="flex gap-3 text-sm sm:text-[15px] leading-relaxed">
                  <span className="font-semibold tabular-nums min-w-[1.5rem]">{idx + 1}.</span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                      <p className="flex-1 min-w-0">{q.text}</p>
                      <div className="no-print flex items-center gap-2 shrink-0">
                        <DifficultyBadge difficulty={q.difficulty} />
                        <MarksBadge marks={q.marks} />
                      </div>
                      <span className="print:inline hidden font-semibold text-ink-700">[{q.marks}]</span>
                    </div>
                    <QuestionBody q={q} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <footer className="text-center pt-8 mt-8 border-t border-dashed border-ink-300">
        <p className="text-sm font-semibold tracking-wide">— End of Question Paper —</p>
      </footer>
    </div>
  );
});

function QuestionBody({ q }: { q: GeneratedQuestion }) {
  if (q.type === 'mcq' && q.options?.length) {
    return (
      <ol className="mt-2 ml-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        {q.options.map((opt, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-semibold text-ink-700">({String.fromCharCode(97 + i)})</span>
            <span>{opt}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (q.type === 'true_false') {
    return (
      <div className="mt-2 ml-1 flex gap-6 text-sm text-ink-700">
        <span>◯ True</span>
        <span>◯ False</span>
      </div>
    );
  }
  return (
    <div
      className={`mt-3 rounded-sm border-b border-dashed border-ink-300 ${
        q.type === 'short' ? 'h-10' : 'h-24'
      }`}
    />
  );
}

function StudentField({ label }: { label: string }) {
  return (
    <div className="flex items-end gap-2">
      <span className="font-semibold whitespace-nowrap">{label}:</span>
      <span className="flex-1 border-b border-ink-400 h-5" />
    </div>
  );
}

function estimateTime(paper: GeneratedPaper): number {
  let minutes = 0;
  for (const s of paper.sections) {
    for (const q of s.questions) {
      if (q.type === 'mcq' || q.type === 'true_false') minutes += 1;
      else if (q.type === 'short') minutes += 4;
      else minutes += 8;
    }
  }
  return Math.max(30, Math.round(minutes / 5) * 5);
}
