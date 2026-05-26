import type { Difficulty } from '@/lib/types';

const STYLES: Record<Difficulty, string> = {
  easy: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  moderate: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  hard: 'bg-red-50 text-red-700 ring-1 ring-red-100',
};

const LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`pill font-sans ${STYLES[difficulty]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {LABELS[difficulty]}
    </span>
  );
}

export function MarksBadge({ marks }: { marks: number }) {
  return (
    <span className="pill font-sans bg-ink-100 text-ink-700 ring-1 ring-ink-200">
      {marks} {marks === 1 ? 'mark' : 'marks'}
    </span>
  );
}
