import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, toPublicUser } from '../models/User';
import { signToken, requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

const SignupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(120),
  schoolName: z.string().trim().min(1, 'School name is required').max(160),
  schoolLocation: z.string().trim().max(160).optional(),
});

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

router.post('/signup', async (req, res: Response) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_failed', issues: parsed.error.issues });
  }
  const { name, email, password, schoolName, schoolLocation } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: 'email_taken', message: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, schoolName, schoolLocation });
  const token = signToken(String(user._id));

  return res.status(201).json({ token, user: toPublicUser(user) });
});

router.post('/login', async (req, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_failed', issues: parsed.error.issues });
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'invalid_credentials', message: 'Incorrect email or password.' });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'invalid_credentials', message: 'Incorrect email or password.' });
  }

  const token = signToken(String(user._id));
  return res.json({ token, user: toPublicUser(user) });
});

router.get('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  return res.json({ user: toPublicUser(req.user) });
});

const UpdateMeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  schoolName: z.string().trim().min(1).max(160).optional(),
  schoolLocation: z.string().trim().max(160).optional(),
  avatarDataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, 'Invalid image data')
    .max(700_000, 'Image too large')
    .nullable()
    .optional(),
});

router.patch('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  const parsed = UpdateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_failed', issues: parsed.error.issues });
  }
  Object.assign(req.user, parsed.data);
  await req.user.save();
  return res.json({ user: toPublicUser(req.user) });
});

export default router;
