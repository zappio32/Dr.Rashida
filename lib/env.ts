import { z } from 'zod';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DEMO_MODE: z.enum(['true', 'false']).default('true'),
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  CLINIC_TIMEZONE: z.string().min(1)
});

export function getServerEnv() {
  const result = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DEMO_MODE: process.env.DEMO_MODE,
    DATABASE_URL: process.env.DATABASE_URL,
    APP_URL: process.env.APP_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    CLINIC_TIMEZONE: process.env.CLINIC_TIMEZONE
  });
  if (!result.success) throw new Error('Invalid server environment configuration.');
  return result.data;
}
