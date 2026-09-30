import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET має містити щонайменше 32 символи'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  APP_TIMEZONE: z
    .string()
    .default('Europe/Kyiv')
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, 'Невідомий часовий пояс'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Читає й валідує змінні оточення один раз; при помилці процес не стартує. */
export const env = (): Env => (cached ??= envSchema.parse(process.env));
