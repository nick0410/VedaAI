import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, UserDoc } from '../models/User';

export interface AuthedRequest extends Request {
  user?: UserDoc;
  userId?: string;
}

export interface JwtPayload {
  sub: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const token = header.slice('Bearer '.length).trim();
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.sub);
    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    req.user = user;
    req.userId = String(user._id);
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}
