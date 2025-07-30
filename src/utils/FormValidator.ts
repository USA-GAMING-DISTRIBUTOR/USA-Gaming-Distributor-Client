import { z } from 'zod';

// Validation schemas
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .max(50, 'Username must be no more than 50 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password must be no more than 100 characters')
});

export const userCreateSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be no more than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be no more than 100 characters'),
  role: z.enum(['Admin', 'Employee'], {
    message: 'Please select a valid role'
  })
});

export const userUpdateSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be no more than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be no more than 100 characters')
    .optional()
    .or(z.literal('')), // Allow empty string for optional password
  role: z.enum(['Admin', 'Employee'], {
    message: 'Please select a valid role'
  })
});

// Types inferred from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type UserCreateFormData = z.infer<typeof userCreateSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;

// Validation result type
export interface ValidationResult {
  success: boolean;
  errors: Record<string, string>;
}

// Helper function to format Zod errors
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.issues.forEach((issue) => {
    const field = issue.path.join('.');
    errors[field] = issue.message;
  });
  
  return errors;
}

// Validation functions
export function validateLogin(data: unknown): ValidationResult {
  try {
    loginSchema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: formatZodErrors(error) };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}

export function validateUserCreate(data: unknown): ValidationResult {
  try {
    userCreateSchema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: formatZodErrors(error) };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}

export function validateUserUpdate(data: unknown): ValidationResult {
  try {
    // Transform empty password to undefined for validation
    const transformedData = typeof data === 'object' && data !== null 
      ? { 
          ...data, 
          password: (data as Record<string, unknown>).password === '' 
            ? undefined 
            : (data as Record<string, unknown>).password 
        }
      : data;
    
    userUpdateSchema.parse(transformedData);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: formatZodErrors(error) };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}
