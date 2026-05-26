import { Router, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { Assignment } from '../models/Assignment';
import { generateForAssignment } from '../services/generate';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(requireAuth);

const QuestionTypeSpecSchema = z.object({
  type: z.enum(['mcq', 'short', 'long', 'true_false']),
  count: z.coerce.number().int().positive(),
  marks: z.coerce.number().int().positive(),
});

const CreateBodySchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  subject: z.string().trim().optional(),
  dueDate: z.coerce.date().refine((d) => d.getTime() >= Date.now() - 86400_000, {
    message: 'Due date cannot be in the past',
  }),
  instructions: z.string().trim().optional(),
  questionTypes: z.array(QuestionTypeSpecSchema).min(1, 'At least one question type required'),
});

router.get('/', async (req: AuthedRequest, res: Response) => {
  try {
    const items = await Assignment.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('title subject dueDate status createdAt questionTypes')
      .lean();
    return res.json({
      items: items.map((a) => ({
        id: String(a._id),
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate,
        status: a.status,
        createdAt: a.createdAt,
        questionTypes: a.questionTypes,
      })),
    });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

router.post('/', upload.single('file'), async (req: AuthedRequest, res: Response) => {
  try {
    const rawTypes =
      typeof req.body.questionTypes === 'string'
        ? JSON.parse(req.body.questionTypes)
        : req.body.questionTypes;

    const parsed = CreateBodySchema.safeParse({
      title: req.body.title,
      subject: req.body.subject,
      dueDate: req.body.dueDate,
      instructions: req.body.instructions,
      questionTypes: rawTypes,
    });

    if (!parsed.success) {
      return res.status(400).json({
        error: 'validation_failed',
        issues: parsed.error.issues,
      });
    }

    const sourceText = req.file ? await extractText(req.file) : undefined;

    const assignment = await Assignment.create({
      ...parsed.data,
      userId: req.userId,
      sourceText,
      status: 'queued',
    });

    try {
      const completed = await generateForAssignment(assignment.id);
      return res.status(201).json({
        id: completed.id,
        status: completed.status,
        paper: completed.paper,
      });
    } catch (e) {
      return res.status(201).json({
        id: assignment.id,
        status: 'failed',
        error: (e as Error).message,
      });
    }
  } catch (e) {
    console.error('[create assignment]', e);
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

router.delete('/:id', async (req: AuthedRequest, res: Response) => {
  try {
    const r = await Assignment.deleteOne({ _id: req.params.id, userId: req.userId });
    if (r.deletedCount === 0) return res.status(404).json({ error: 'not_found' });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

router.get('/:id', async (req: AuthedRequest, res: Response) => {
  try {
    const a = await Assignment.findOne({ _id: req.params.id, userId: req.userId });
    if (!a) return res.status(404).json({ error: 'not_found' });
    return res.json({
      id: a.id,
      title: a.title,
      subject: a.subject,
      dueDate: a.dueDate,
      instructions: a.instructions,
      questionTypes: a.questionTypes,
      status: a.status,
      error: a.error,
      paper: a.paper,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

router.post('/:id/regenerate', async (req: AuthedRequest, res: Response) => {
  try {
    const a = await Assignment.findOne({ _id: req.params.id, userId: req.userId });
    if (!a) return res.status(404).json({ error: 'not_found' });
    a.status = 'queued';
    a.error = undefined;
    a.paper = undefined;
    await a.save();
    try {
      const completed = await generateForAssignment(a.id);
      return res.json({
        id: completed.id,
        status: completed.status,
        paper: completed.paper,
      });
    } catch (e) {
      return res.json({ id: a.id, status: 'failed', error: (e as Error).message });
    }
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

const MAX_SOURCE_CHARS = 20000;

async function extractText(file: Express.Multer.File): Promise<string> {
  const mt = file.mimetype;
  const lowerName = file.originalname.toLowerCase();

  if (mt.startsWith('text/') || lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
    return file.buffer.toString('utf-8').slice(0, MAX_SOURCE_CHARS);
  }

  if (mt === 'application/pdf' || lowerName.endsWith('.pdf')) {
    try {
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js' as string)).default as (
        b: Buffer
      ) => Promise<{ text: string }>;
      const result = await pdfParse(file.buffer);
      const cleaned = (result.text ?? '')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      if (cleaned.length < 30) return '';
      return cleaned.slice(0, MAX_SOURCE_CHARS);
    } catch (e) {
      console.warn('[pdf-parse] failed:', (e as Error).message);
      return '';
    }
  }
  return '';
}

export default router;
