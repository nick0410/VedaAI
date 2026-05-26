import { Schema, model, Document, Types } from 'mongoose';

export interface Student {
  _id: Types.ObjectId;
  name: string;
  rollNumber: string;
  attendancePercent: number;
}

export interface GroupDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  grade: string;
  students: Types.DocumentArray<Student>;
  assignedAssignments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<Student>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    rollNumber: { type: String, required: true, trim: true, maxlength: 40 },
    attendancePercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: true, timestamps: false }
);

const GroupSchema = new Schema<GroupDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    grade: { type: String, required: true, trim: true, maxlength: 120 },
    students: { type: [StudentSchema], default: [] },
    assignedAssignments: { type: [Schema.Types.ObjectId], ref: 'Assignment', default: [] },
  },
  { timestamps: true }
);

export const Group = model<GroupDoc>('Group', GroupSchema);
