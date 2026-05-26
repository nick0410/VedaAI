import { z } from 'zod';
import type { GeneratedPaper } from '../models/Assignment';

const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  type: z.enum(['mcq', 'short', 'long', 'true_false']),
  difficulty: z.enum(['easy', 'moderate', 'hard']),
  marks: z.number().int().positive(),
  options: z.array(z.string().min(1)).optional(),
});

const SectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});

const PaperSchema = z.object({
  title: z.string().min(1),
  subject: z.string().nullable().optional(),
  totalMarks: z.number().int().positive(),
  sections: z.array(SectionSchema).min(1),
});

export function parsePaper(raw: string): GeneratedPaper {
  const jsonText = extractJsonBlock(raw);
  let obj: unknown;
  try {
    obj = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`LLM output is not valid JSON: ${(e as Error).message}`);
  }
  const parsed = PaperSchema.safeParse(obj);
  if (!parsed.success) {
    throw new Error(`LLM JSON failed schema: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
  const data = parsed.data;
  for (const s of data.sections) {
    for (const q of s.questions) {
      if (q.type === 'mcq' && (!q.options || q.options.length !== 4)) {
        throw new Error(`MCQ ${q.id} must have exactly 4 options`);
      }
    }
  }
  return {
    title: data.title,
    subject: data.subject ?? undefined,
    totalMarks: data.totalMarks,
    sections: data.sections,
  };
}

function extractJsonBlock(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) return trimmed;
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}
