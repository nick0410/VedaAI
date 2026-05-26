import { Schema, model, Document, Types } from 'mongoose';

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

export interface AssignmentDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  subject?: string;
  dueDate: Date;
  instructions?: string;
  sourceText?: string;
  questionTypes: QuestionTypeSpec[];
  status: AssignmentStatus;
  error?: string;
  paper?: GeneratedPaper;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSpecSchema = new Schema<QuestionTypeSpec>(
  {
    type: { type: String, enum: ['mcq', 'short', 'long', 'true_false'], required: true },
    count: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const QuestionSchema = new Schema<GeneratedQuestion>(
  {
    id: String,
    text: String,
    type: { type: String, enum: ['mcq', 'short', 'long', 'true_false'] },
    difficulty: { type: String, enum: ['easy', 'moderate', 'hard'] },
    marks: Number,
    options: [String],
  },
  { _id: false }
);

const SectionSchema = new Schema<GeneratedSection>(
  {
    id: String,
    title: String,
    instruction: String,
    questions: [QuestionSchema],
  },
  { _id: false }
);

const PaperSchema = new Schema<GeneratedPaper>(
  {
    title: String,
    subject: String,
    school: String,
    schoolLocation: String,
    teacherName: String,
    totalMarks: Number,
    sections: [SectionSchema],
  },
  { _id: false }
);

const AssignmentSchema = new Schema<AssignmentDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    dueDate: { type: Date, required: true },
    instructions: { type: String, trim: true },
    sourceText: { type: String },
    questionTypes: { type: [QuestionTypeSpecSchema], required: true },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    error: String,
    paper: PaperSchema,
  },
  { timestamps: true }
);

export const Assignment = model<AssignmentDoc>('Assignment', AssignmentSchema);
