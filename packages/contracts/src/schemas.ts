import { z } from 'zod';
import { isIsoDate } from './dates.js';
import { DOCUMENT_TYPE_KEYS } from './documents.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Некоректний ідентифікатор');
export const isoDateSchema = z.string().refine(isIsoDate, 'Дата має бути у форматі РРРР-ММ-ДД');
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => /^\+?[\d\s()-]{10,20}$/.test(v) && v.replace(/\D/g, '').length >= 10, 'Телефон у форматі +380 XX XXX XX XX');

export const clientInputSchema = z.object({
  name: z.string().trim().min(3, 'Вкажіть ПІБ').max(120),
  phone: phoneSchema,
  email: z
    .union([z.string().trim().toLowerCase().email('Некоректний email').max(120), z.literal('')])
    .optional()
    .transform((v) => v || undefined),
  note: optionalText(1000),
});
export type ClientInput = z.infer<typeof clientInputSchema>;

export const clientUpdateSchema = clientInputSchema.partial();
export type ClientUpdate = z.infer<typeof clientUpdateSchema>;

export const documentTypeSchema = z.enum(DOCUMENT_TYPE_KEYS);

export const visitCreateSchema = z
  .object({
    clientId: objectId.optional(),
    newClient: clientInputSchema.optional(),
    date: z.string().datetime({ offset: true, message: 'Вкажіть дату й час візиту' }),
    type: documentTypeSchema,
    pickupDate: isoDateSchema,
    note: optionalText(1000),
  })
  .refine((v) => Boolean(v.clientId) !== Boolean(v.newClient), {
    message: 'Оберіть клієнта з бази або додайте нового',
    path: ['clientId'],
  });
export type VisitCreate = z.infer<typeof visitCreateSchema>;

export const visitUpdateSchema = z.object({
  date: z.string().datetime({ offset: true }).optional(),
  type: documentTypeSchema.optional(),
  pickupDate: isoDateSchema.optional(),
  note: optionalText(1000),
});
export type VisitUpdate = z.infer<typeof visitUpdateSchema>;

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
};
const search = z.string().trim().max(100).optional();
const dateRange = { from: isoDateSchema.optional(), to: isoDateSchema.optional() };

export const clientsQuerySchema = z.object({ q: search, ...pagination });
export type ClientsQuery = z.input<typeof clientsQuerySchema>;

export const visitsQuerySchema = z.object({
  q: search,
  type: documentTypeSchema.optional(),
  status: z.enum(['all', 'planned', 'done']).default('all'),
  clientId: objectId.optional(),
  ...dateRange,
  ...pagination,
});
export type VisitsQuery = z.input<typeof visitsQuerySchema>;

export const pickupsQuerySchema = z.object({
  mode: z.enum(['pending', 'issued', 'all']).default('pending'),
  q: search,
  ...dateRange,
  page: pagination.page,
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
export type PickupsQuery = z.input<typeof pickupsQuerySchema>;

export const statsQuerySchema = z
  .object({ from: isoDateSchema, to: isoDateSchema, type: documentTypeSchema.optional() })
  .refine((v) => v.from <= v.to, { message: 'Початок періоду має бути раніше за кінець', path: ['from'] });
export type StatsQuery = z.input<typeof statsQuerySchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некоректний email'),
  password: z.string().min(8, 'Мінімум 8 символів').max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const idParamSchema = z.object({ id: objectId });
