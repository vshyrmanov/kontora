import { DOCUMENT_TYPE_KEYS } from '@kontora/contracts';
import { model, Schema, type HydratedDocument, type InferSchemaType } from 'mongoose';

const visitSchema = new Schema(
  {
    ref: { type: String, required: true, unique: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    date: { type: Date, required: true, index: true },
    type: { type: String, enum: DOCUMENT_TYPE_KEYS, required: true },
    /** YYYY-MM-DD у часовому поясі установи. */
    pickupDate: { type: String, required: true },
    issuedAt: { type: String, default: null },
    note: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

visitSchema.index({ issuedAt: 1, pickupDate: 1 });

export type VisitRecord = InferSchemaType<typeof visitSchema>;
export type VisitDocument = HydratedDocument<VisitRecord>;
export const Visit = model('Visit', visitSchema);
