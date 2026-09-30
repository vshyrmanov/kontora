import { model, Schema, type HydratedDocument, type InferSchemaType } from 'mongoose';

const clientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    /** Лише цифри телефону — ключ для пошуку дублікатів. */
    phoneDigits: { type: String, required: true, unique: true },
    email: { type: String, trim: true, lowercase: true, default: null },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

clientSchema.index({ name: 1 });

export type ClientRecord = InferSchemaType<typeof clientSchema>;
export type ClientDocument = HydratedDocument<ClientRecord>;
export const Client = model('Client', clientSchema);
