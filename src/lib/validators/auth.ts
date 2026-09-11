import { z } from 'zod';
import { USER_ROLES } from '@/types/enums';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = loginSchema.extend({
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(USER_ROLES).default('mechanic'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
