import { Queue } from 'bullmq';
import { redisConnection } from '../db/redis';

export const GENERATION_QUEUE = 'assessment-generation';

export interface GenerationJobData {
  assignmentId: string;
}

export const generationQueue = new Queue<GenerationJobData>(GENERATION_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1500 },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

export async function enqueueGeneration(assignmentId: string): Promise<void> {
  await generationQueue.add('generate', { assignmentId });
}
