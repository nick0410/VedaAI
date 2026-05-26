'use client';

import { create } from 'zustand';
import type { Assignment, AssignmentStatus, GeneratedPaper, QuestionTypeSpec } from '@/lib/types';

export interface DraftState {
  title: string;
  subject: string;
  dueDate: string;
  instructions: string;
  questionTypes: QuestionTypeSpec[];
  file: File | null;
}

interface Store {
  draft: DraftState;
  setDraft: (patch: Partial<DraftState>) => void;
  resetDraft: () => void;

  currentAssignmentId: string | null;
  status: AssignmentStatus | 'idle';
  paper: GeneratedPaper | null;
  errorMessage: string | null;
  setCurrentAssignment: (assignment: Assignment) => void;
  setStatus: (status: AssignmentStatus, error?: string) => void;
  setPaper: (paper: GeneratedPaper) => void;
  clearPaper: () => void;
  clear: () => void;
}

const initialDraft: DraftState = {
  title: '',
  subject: '',
  dueDate: '',
  instructions: '',
  questionTypes: [
    { type: 'mcq', count: 5, marks: 1 },
    { type: 'short', count: 3, marks: 2 },
  ],
  file: null,
};

export const useAssignmentStore = create<Store>((set) => ({
  draft: initialDraft,
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  resetDraft: () => set({ draft: initialDraft }),

  currentAssignmentId: null,
  status: 'idle',
  paper: null,
  errorMessage: null,

  setCurrentAssignment: (a) =>
    set({
      currentAssignmentId: a.id,
      status: a.status,
      paper: a.paper ?? null,
      errorMessage: a.error ?? null,
    }),
  setStatus: (status, error) => set({ status, errorMessage: error ?? null }),
  setPaper: (paper) => set({ paper, status: 'completed', errorMessage: null }),
  clearPaper: () => set({ paper: null, errorMessage: null }),
  clear: () =>
    set({
      currentAssignmentId: null,
      status: 'idle',
      paper: null,
      errorMessage: null,
    }),
}));
