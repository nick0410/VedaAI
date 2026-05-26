import { Worker, Job } from 'bullmq';
import { redisConnection } from '../db/redis';
import { Assignment } from '../models/Assignment';
import { User } from '../models/User';
import { buildPrompt } from '../services/prompt';
import { callLLM, mockGenerate } from '../services/llm';
import { parsePaper } from '../services/parser';
import { emitToAssignment } from '../ws/socket';
import { GENERATION_QUEUE, GenerationJobData } from './queue';
import { env } from '../config/env';
import type { GeneratedPaper } from '../models/Assignment';

export function startWorker(): Worker<GenerationJobData> {
  const worker = new Worker<GenerationJobData>(
    GENERATION_QUEUE,
    async (job: Job<GenerationJobData>) => {
      const { assignmentId } = job.data;
      const totalAttempts = job.opts.attempts ?? 1;
      const attemptNumber = job.attemptsMade + 1;
      const isLastAttempt = attemptNumber >= totalAttempts;

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) throw new Error(`assignment ${assignmentId} not found`);

      assignment.status = 'processing';
      assignment.error = undefined;
      await assignment.save();
      emitToAssignment(assignmentId, 'assignment:status', { status: 'processing' });

      let paper: GeneratedPaper;
      try {
        if (env.llm.provider === 'mock') {
          paper = mockGenerate(assignment);
        } else {
          const prompt = buildPrompt(assignment);
          const raw = await callLLM(prompt);
          paper = parsePaper(raw);
        }
      } catch (e) {
        const msg = (e as Error).message;
        if (msg === 'USE_MOCK') {
          paper = mockGenerate(assignment);
        } else {
          console.warn(
            `[worker] attempt ${attemptNumber}/${totalAttempts} for ${assignmentId} failed: ${msg}`
          );
          if (isLastAttempt) {
            assignment.status = 'failed';
            assignment.error = msg;
            await assignment.save();
            emitToAssignment(assignmentId, 'assignment:status', {
              status: 'failed',
              error: msg,
            });
          }
          // Leave status as 'processing' for retries; BullMQ will re-run this job.
          throw e;
        }
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

      emitToAssignment(assignmentId, 'assignment:update', {
        status: 'completed',
        paper,
      });
    },
    { connection: redisConnection, concurrency: 2 }
  );

  worker.on('completed', (job) => console.log(`[worker] job ${job.id} completed`));
  worker.on('failed', (job, err) =>
    console.error(
      `[worker] job ${job?.id} attempt ${job?.attemptsMade}/${job?.opts.attempts} failed:`,
      err.message
    )
  );

  return worker;
}
