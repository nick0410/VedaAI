import { env } from '../config/env';
import type { AssignmentDoc, GeneratedPaper, QuestionType, Difficulty } from '../models/Assignment';

export async function callLLM(prompt: string): Promise<string> {
  switch (env.llm.provider) {
    case 'openai':
      return callOpenAI(prompt);
    case 'anthropic':
      return callAnthropic(prompt);
    case 'groq':
      return callGroq(prompt);
    case 'mock':
    default:
      throw new Error('USE_MOCK');
  }
}

async function callGroq(prompt: string): Promise<string> {
  if (!env.llm.groqKey) throw new Error('GROQ_API_KEY missing');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.llm.groqKey}`,
    },
    body: JSON.stringify({
      model: env.llm.groqModel,
      messages: [
        {
          role: 'system',
          content:
            'You output only a single valid JSON object matching the schema in the user message. No prose, no markdown fences.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}

async function callOpenAI(prompt: string): Promise<string> {
  if (!env.llm.openaiKey) throw new Error('OPENAI_API_KEY missing');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.llm.openaiKey}`,
    },
    body: JSON.stringify({
      model: env.llm.openaiModel,
      messages: [
        { role: 'system', content: 'You output only valid JSON matching the schema in the user message.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}

async function callAnthropic(prompt: string): Promise<string> {
  if (!env.llm.anthropicKey) throw new Error('ANTHROPIC_API_KEY missing');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.llm.anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.llm.anthropicModel,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: { type: string; text: string }[] };
  return data.content.map((c) => c.text).join('');
}

// Deterministic fallback that returns a fully valid paper matching the assignment spec.
export function mockGenerate(a: AssignmentDoc): GeneratedPaper {
  const sectionLetters = ['A', 'B', 'C', 'D'];
  const sections = a.questionTypes.map((spec, idx) => {
    const letter = sectionLetters[idx] ?? String.fromCharCode(65 + idx);
    return {
      id: letter,
      title: `Section ${letter} — ${sectionTitle(spec.type)}`,
      instruction: sectionInstruction(spec.type, spec.count, spec.marks),
      questions: Array.from({ length: spec.count }, (_, i) => {
        const qid = `${letter}${i + 1}`;
        return {
          id: qid,
          text: sampleQuestion(spec.type, i + 1, a.title, a.subject, a.sourceText),
          type: spec.type,
          difficulty: pickDifficulty(i, spec.count),
          marks: spec.marks,
          options: spec.type === 'mcq' ? sampleOptions(i + 1) : undefined,
        };
      }),
    };
  });
  const totalMarks = a.questionTypes.reduce((s, q) => s + q.count * q.marks, 0);
  return {
    title: a.title,
    subject: a.subject,
    totalMarks,
    sections,
  };
}

function sectionTitle(t: QuestionType): string {
  return t === 'mcq'
    ? 'Multiple Choice'
    : t === 'short'
    ? 'Short Answer'
    : t === 'long'
    ? 'Long Answer'
    : 'True / False';
}

function sectionInstruction(t: QuestionType, count: number, marks: number): string {
  const total = count * marks;
  if (t === 'mcq') return `Attempt all ${count} questions. Choose the most appropriate option. (${count} × ${marks} = ${total} marks)`;
  if (t === 'true_false') return `State whether each statement is True or False. (${count} × ${marks} = ${total} marks)`;
  if (t === 'short') return `Answer all ${count} questions briefly. (${count} × ${marks} = ${total} marks)`;
  return `Answer all ${count} questions in detail. (${count} × ${marks} = ${total} marks)`;
}

function pickDifficulty(i: number, total: number): Difficulty {
  const r = i / Math.max(total, 1);
  if (r < 0.4) return 'easy';
  if (r < 0.8) return 'moderate';
  return 'hard';
}

function sampleQuestion(t: QuestionType, n: number, title: string, subject?: string, source?: string): string {
  const ctx = subject || title;
  const sourceHint = source ? ` (refer to the provided material)` : '';
  if (t === 'mcq') return `Which of the following best describes a key concept of ${ctx}?${sourceHint}`;
  if (t === 'true_false') return `${ctx} fundamentally depends on the principle described in topic #${n}.${sourceHint}`;
  if (t === 'short') return `Briefly explain a core idea from ${ctx} (topic ${n}).${sourceHint}`;
  return `Discuss in detail one major aspect of ${ctx} relevant to topic ${n}, with examples.${sourceHint}`;
}

function sampleOptions(n: number): string[] {
  return [
    `Option A for question ${n}`,
    `Option B for question ${n}`,
    `Option C for question ${n}`,
    `Option D for question ${n}`,
  ];
}
