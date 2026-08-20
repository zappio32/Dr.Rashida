import { z } from 'zod';
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
export const appointmentSchema = z.object({ serviceId: z.string().min(1), consultationType: z.enum(['ONLINE', 'CLINIC']), localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), localTime: z.string().regex(/^\d{2}:\d{2}$/), concern: z.string().max(3000).optional(), notes: z.string().max(3000).optional() });
