import { model, Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'registrar'], required: true, default: 'registrar' },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

export type UserRecord = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
