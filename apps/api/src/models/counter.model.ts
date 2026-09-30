import { model, Schema } from 'mongoose';

const counterSchema = new Schema({ _id: { type: String, required: true }, seq: { type: Number, default: 0 } });
const Counter = model('Counter', counterSchema);

/** Атомарний лічильник: безпечний при паралельних запитах. */
export const nextSequence = async (name: string): Promise<number> => {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean();
  return counter!.seq;
};
