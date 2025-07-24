import { z } from 'zod';

const commonValidators = {
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
};

export const authSchemas = {
  register: z.object({
    email: commonValidators.email,
    name: commonValidators.name,
    password: commonValidators.password,
  }),
  registerWithConfirm: z.object({
    email: commonValidators.email,
    name: commonValidators.name,
    password: commonValidators.password,
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
  login: z.object({
    email: commonValidators.email,
    password: z.string().min(1, 'Password is required'),
  }),
};