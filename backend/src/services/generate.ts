import { Assignment, AssignmentDoc, GeneratedPaper } from '../models/Assignment';
import { User } from '../models/User';
import { env } from '../config/env';
import { buildPrompt } from './prompt';
import { callLLM, mockGenerate } from './llm';
import { parsePaper } from './parser';

const MAX_ATTEMPTS = 3;

export async function generateForAssignment(assignmentId: string): Promise<AssignmentDoc> {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error(`assignment ${assignmentId} not found`);

  assignment.status = 'processing';
  assignment.error = undefined;
  await assignment.save();

  let paper: GeneratedPaper | null = null;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      if (env.llm.provider === 'mock') {
        paper = mockGenerate(assignment);
      } else {
        const prompt = buildPrompt(assignment);
        const raw = await callLLM(prompt);
        paper = parsePaper(raw);
      }
      break;
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'USE_MOCK') {
        paper = mockGenerate(assignment);
        break;
      }
      lastError = e as Error;
      console.warn(`[generate] attempt ${attempt}/${MAX_ATTEMPTS} for ${assignmentId} failed: ${msg}`);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  if (!paper) {
    const msg = lastError?.message ?? 'unknown generation error';
    assignment.status = 'failed';
    assignment.error = msg;
    await assignment.save();
    throw lastError ?? new Error(msg);
  }

  const owner = await User.findById(assignment.userId);
  if (owner) {
    paper.school = owner.schoolName;
    paper.schoolLocation = owner.schoolLocation;
    paper.teacherName = owner.name;
  }

  assignment.paper = paper;
  assignment.status = 'completed';
  assignment.error = undefined;
  await assignment.save();

  return assignment;
}
