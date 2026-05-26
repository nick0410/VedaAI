import { Schema, model, Document, Types } from 'mongoose';

export interface UserDoc extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  schoolName: string;
  schoolLocation?: string;
  avatarDataUrl?: string;
  role: 'teacher' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    schoolName: { type: String, required: true, trim: true },
    schoolLocation: { type: String, trim: true },
    avatarDataUrl: { type: String },
    role: { type: String, enum: ['teacher', 'admin'], default: 'teacher' },
  },
  { timestamps: true }
);

export const User = model<UserDoc>('User', UserSchema);

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  schoolName: string;
  schoolLocation?: string;
  avatarDataUrl?: string;
  role: 'teacher' | 'admin';
}

export function toPublicUser(u: UserDoc): PublicUser {
  return {
    id: String(u._id),
    email: u.email,
    name: u.name,
    schoolName: u.schoolName,
    schoolLocation: u.schoolLocation,
    avatarDataUrl: u.avatarDataUrl,
    role: u.role,
  };
}
