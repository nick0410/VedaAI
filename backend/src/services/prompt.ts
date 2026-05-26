import type { AssignmentDoc } from '../models/Assignment';

export function buildPrompt(a: AssignmentDoc): string {
  const breakdown = a.questionTypes
    .map((q) => `- ${q.count} × ${labelFor(q.type)} (${q.marks} mark${q.marks === 1 ? '' : 's'} each)`)
    .join('\n');

  const totalMarks = a.questionTypes.reduce((s, q) => s + q.count * q.marks, 0);

  const source = a.sourceText
    ? `\n\nSOURCE MATERIAL (use as the basis for the questions; do not fabricate facts outside it):\n"""\n${a.sourceText.slice(0, 8000)}\n"""`
    : '';

  return `You are an expert assessment designer. Generate a structured exam question paper.

Title: ${a.title}
${a.subject ? `Subject: ${a.subject}\n` : ''}Due: ${a.dueDate.toISOString().slice(0, 10)}
Total marks (expected): ${totalMarks}

Question requirements:
${breakdown}

${a.instructions ? `Additional instructions from teacher:\n${a.instructions}\n` : ''}${source}

OUTPUT FORMAT — return ONLY a single JSON object, no prose, no markdown fences:

{
  "title": "string",
  "subject": "string | null",
  "totalMarks": number,
  "sections": [
    {
      "id": "A",
      "title": "Section A — <descriptive>",
      "instruction": "string",
      "questions": [
        {
          "id": "A1",
          "text": "string",
          "type": "mcq" | "short" | "long" | "true_false",
          "difficulty": "easy" | "moderate" | "hard",
          "marks": number,
          "options": ["string", ...]   // ONLY for mcq, exactly 4 options
        }
      ]
    }
  ]
}

Rules:
- Group questions into sections by type (A = MCQ, B = Short, C = Long, D = True/False) — skip absent types.
- Mix difficulty across each section: roughly 40% easy, 40% moderate, 20% hard.
- Marks per question MUST match the requested marks for that type.
- For MCQ, ALWAYS include "options" with exactly 4 distinct plausible options.
- Question count per type MUST match exactly.
- Do not include answers.
- Return JSON only.

CRITICAL FORMATTING RULES — these are the most common mistakes; obey them strictly:
- "sections" MUST be an array of OBJECTS, never an array of strings.
- Each section object MUST have keys: id, title, instruction, questions.
- "questions" MUST be an array of OBJECTS, never an array of strings.
- Each question object MUST have keys: id, text, type, difficulty, marks (plus "options" only for mcq).
- Do NOT serialize nested objects as JSON strings.
- Return the JSON OBJECT directly, NOT a string containing JSON.

Minimal example showing the exact shape required:
{
  "title": "Sample",
  "subject": "Physics",
  "totalMarks": 2,
  "sections": [
    {
      "id": "A",
      "title": "Section A — Multiple Choice",
      "instruction": "Attempt all questions.",
      "questions": [
        {
          "id": "A1",
          "text": "What is the SI unit of force?",
          "type": "mcq",
          "difficulty": "easy",
          "marks": 1,
          "options": ["Newton", "Joule", "Watt", "Pascal"]
        }
      ]
    },
    {
      "id": "B",
      "title": "Section B — Short Answer",
      "instruction": "Answer briefly.",
      "questions": [
        {
          "id": "B1",
          "text": "State Newton's first law of motion.",
          "type": "short",
          "difficulty": "easy",
          "marks": 1
        }
      ]
    }
  ]
}`;
}

function labelFor(t: string): string {
  switch (t) {
    case 'mcq':
      return 'Multiple Choice Questions';
    case 'short':
      return 'Short Answer Questions';
    case 'long':
      return 'Long Answer Questions';
    case 'true_false':
      return 'True / False';
    default:
      return t;
  }
}
