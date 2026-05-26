export type Difficulty = 'easy' | 'moderate' | 'hard';
export type QuestionType = 'mcq' | 'short' | 'long' | 'true_false';
export type AssignmentStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface QuestionTypeSpec {
  type: QuestionType;
  count: number;
  marks: number;
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
}

export interface GeneratedSection {
  id: string;
  title: string;
  instruction: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedPaper {
  title: string;
  subject?: string;
  school?: string;
  schoolLocation?: string;
  teacherName?: string;
  totalMarks: number;
  sections: GeneratedSection[];
}

export interface Assignment {
  id: string;
  title: string;
  subject?: string;
  dueDate: string;
  instructions?: string;
  questionTypes: QuestionTypeSpec[];
  status: AssignmentStatus;
  error?: string;
  paper?: GeneratedPaper;
  createdAt: string;
  updatedAt: string;
}

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  mcq: 'Multiple Choice',
  short: 'Short Answer',
  long: 'Long Answer',
  true_false: 'True / False',
};
