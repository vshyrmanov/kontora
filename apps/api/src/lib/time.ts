import { isoDateInZone, zonedRange, type IsoDate } from '@kontora/contracts';
import { env } from '../config/env.js';

/** «Сьогодні» в часовому поясі установи. */
export const today = (now = new Date()): IsoDate => isoDateInZone(now, env().APP_TIMEZONE);

export const localDateOf = (at: Date): IsoDate => isoDateInZone(at, env().APP_TIMEZONE);

export const dayRange = (from: IsoDate, to: IsoDate) => zonedRange(from, to, env().APP_TIMEZONE);
