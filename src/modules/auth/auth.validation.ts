import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters long'),
    name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters long'),
    role: z.enum([Role.CUSTOMER, Role.TECHNICIAN], {
      errorMap: () => ({ message: 'Role must be either CUSTOMER or TECHNICIAN' }),
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }),
  }),
});
