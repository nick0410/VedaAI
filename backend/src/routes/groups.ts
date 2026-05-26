import { Router, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Group } from '../models/Group';
import { Assignment } from '../models/Assignment';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const StudentInputSchema = z.object({
  name: z.string().trim().min(1, 'Student name is required').max(120),
  rollNumber: z.string().trim().min(1, 'Roll number is required').max(40),
  attendancePercent: z.coerce.number().min(0).max(100).default(0),
});

const CreateGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(120),
  grade: z.string().trim().min(1, 'Grade is required').max(120),
});

const UpdateGroupSchema = CreateGroupSchema.partial();

const AddStudentsSchema = z.object({
  students: z.array(StudentInputSchema).min(1).max(1000),
});

const UpdateStudentSchema = StudentInputSchema.partial();

function isObjectId(v: string): boolean {
  return Types.ObjectId.isValid(v);
}

function serializeGroup(g: any) {
  return {
    id: String(g._id),
    name: g.name,
    grade: g.grade,
    students: (g.students ?? []).map((s: any) => ({
      id: String(s._id),
      name: s.name,
      rollNumber: s.rollNumber,
      attendancePercent: s.attendancePercent,
    })),
    assignedAssignments: (g.assignedAssignments ?? []).map((a: any) =>
      typeof a === 'object' && a !== null && '_id' in a
        ? {
            id: String(a._id),
            title: a.title,
            subject: a.subject,
            status: a.status,
            dueDate: a.dueDate,
          }
        : { id: String(a) }
    ),
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

// LIST
router.get('/', async (req: AuthedRequest, res: Response) => {
  try {
    const groups = await Group.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    return res.json({ items: groups.map(serializeGroup) });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

// CREATE
router.post('/', async (req: AuthedRequest, res: Response) => {
  const parsed = CreateGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_failed', issues: parsed.error.issues });
  }
  try {
    const g = await Group.create({ ...parsed.data, userId: req.userId });
    return res.status(201).json({ group: serializeGroup(g) });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

// READ one (with populated assignments)
router.get('/:id', async (req: AuthedRequest, res: Response) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ error: 'bad_id' });
  try {
    const g = await Group.findOne({ _id: req.params.id, userId: req.userId })
      .populate({
        path: 'assignedAssignments',
        select: 'title subject status dueDate',
      })
      .lean();
    if (!g) return res.status(404).json({ error: 'not_found' });
    return res.json({ group: serializeGroup(g) });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

// UPDATE meta
router.patch('/:id', async (req: AuthedRequest, res: Response) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ error: 'bad_id' });
  const parsed = UpdateGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_failed', issues: parsed.error.issues });
  }
  try {
    const g = await Group.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: parsed.data },
      { new: true }
    );
    if (!g) return res.status(404).json({ error: 'not_found' });
    return res.json({ group: serializeGroup(g) });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

// DELETE group
router.delete('/:id', async (req: AuthedRequest, res: Response) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ error: 'bad_id' });
  try {
    const r = await Group.deleteOne({ _id: req.params.id, userId: req.userId });
    if (r.deletedCount === 0) return res.status(404).json({ error: 'not_found' });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

// ADD students (bulk — works for manual & CSV)
router.post('/:id/students', async (req: AuthedRequest, res: Response) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ error: 'bad_id' });
  const parsed = AddStudentsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_failed', issues: parsed.error.issues });
  }
  try {
    const g = await Group.findOne({ _id: req.params.id, userId: req.userId });
    if (!g) return res.status(404).json({ error: 'not_found' });

    const seen = new Set(g.students.map((s) => s.rollNumber.toLowerCase()));
    const fresh: typeof parsed.data.students = [];
    let duplicates = 0;
    for (const s of parsed.data.students) {
      const key = s.rollNumber.toLowerCase();
      if (seen.has(key)) {
        duplicates += 1;
        continue;
      }
      seen.add(key);
      fresh.push(s);
    }

    for (const s of fresh) g.students.push(s as any);
    await g.save();

    return res.json({
      group: serializeGroup(g),
      added: fresh.length,
      skippedDuplicates: duplicates,
    });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

// UPDATE one student
router.patch('/:id/students/:studentId', async (req: AuthedRequest, res: Response) => {
  if (!isObjectId(req.params.id) || !isObjectId(req.params.studentId))
    return res.status(400).json({ error: 'bad_id' });
  const parsed = UpdateStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_failed', issues: parsed.error.issues });
  }
  try {
    const g = await Group.findOne({ _id: req.params.id, userId: req.userId });
    if (!g) return res.status(404).json({ error: 'not_found' });
    const s = g.students.id(req.params.studentId);
    if (!s) return res.status(404).json({ error: 'student_not_found' });
    if (parsed.data.name !== undefined) s.name = parsed.data.name;
    if (parsed.data.rollNumber !== undefined) s.rollNumber = parsed.data.rollNumber;
    if (parsed.data.attendancePercent !== undefined) s.attendancePercent = parsed.data.attendancePercent;
    await g.save();
    return res.json({ group: serializeGroup(g) });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

// REMOVE one student
router.delete('/:id/students/:studentId', async (req: AuthedRequest, res: Response) => {
  if (!isObjectId(req.params.id) || !isObjectId(req.params.studentId))
    return res.status(400).json({ error: 'bad_id' });
  try {
    const g = await Group.findOne({ _id: req.params.id, userId: req.userId });
    if (!g) return res.status(404).json({ error: 'not_found' });
    const s = g.students.id(req.params.studentId);
    if (!s) return res.status(404).json({ error: 'student_not_found' });
    s.deleteOne();
    await g.save();
    return res.json({ group: serializeGroup(g) });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

// ASSIGN one of MY assignments to this group
router.post('/:id/assignments', async (req: AuthedRequest, res: Response) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ error: 'bad_id' });
  const schema = z.object({ assignmentId: z.string().refine(isObjectId, 'bad assignment id') });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_failed', issues: parsed.error.issues });
  }
  try {
    // Confirm the assignment belongs to this user
    const a = await Assignment.findOne({ _id: parsed.data.assignmentId, userId: req.userId }).lean();
    if (!a) return res.status(404).json({ error: 'assignment_not_found' });

    const g = await Group.findOne({ _id: req.params.id, userId: req.userId });
    if (!g) return res.status(404).json({ error: 'not_found' });

    const aId = new Types.ObjectId(parsed.data.assignmentId);
    const already = g.assignedAssignments.some((x) => String(x) === String(aId));
    if (!already) {
      g.assignedAssignments.push(aId);
      await g.save();
    }
    const populated = await Group.findById(g._id).populate({
      path: 'assignedAssignments',
      select: 'title subject status dueDate',
    }).lean();
    return res.json({ group: serializeGroup(populated) });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

// UN-assign
router.delete('/:id/assignments/:assignmentId', async (req: AuthedRequest, res: Response) => {
  if (!isObjectId(req.params.id) || !isObjectId(req.params.assignmentId))
    return res.status(400).json({ error: 'bad_id' });
  try {
    const g = await Group.findOne({ _id: req.params.id, userId: req.userId });
    if (!g) return res.status(404).json({ error: 'not_found' });
    g.assignedAssignments = g.assignedAssignments.filter(
      (x) => String(x) !== req.params.assignmentId
    ) as any;
    await g.save();
    const populated = await Group.findById(g._id).populate({
      path: 'assignedAssignments',
      select: 'title subject status dueDate',
    }).lean();
    return res.json({ group: serializeGroup(populated) });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: (e as Error).message });
  }
});

export default router;
