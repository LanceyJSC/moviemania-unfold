import { z } from 'zod';

// Profile validation schemas
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const fullNameSchema = z
  .string()
  .max(100, 'Name must be less than 100 characters')
  .optional()
  .nullable();

export const bioSchema = z
  .string()
  .max(500, 'Bio must be less than 500 characters')
  .optional()
  .nullable();

export const profileUpdateSchema = z.object({
  username: usernameSchema.optional(),
  full_name: fullNameSchema,
  bio: bioSchema,
  avatar_url: z.string().url('Invalid avatar URL').optional().nullable(),
});

// Review/Notes validation
export const reviewTextSchema = z
  .string()
  .max(5000, 'Review must be less than 5000 characters')
  .optional()
  .nullable();

export const commentSchema = z
  .string()
  .min(1, 'Comment cannot be empty')
  .max(1000, 'Comment must be less than 1000 characters');

// List validation
export const listNameSchema = z
  .string()
  .min(1, 'List name is required')
  .max(100, 'List name must be less than 100 characters');

export const listDescriptionSchema = z
  .string()
  .max(500, 'Description must be less than 500 characters')
  .optional()
  .nullable();

// Media logging validation
export const diaryNotesSchema = z
  .string()
  .max(5000, 'Notes must be less than 5000 characters')
  .optional()
  .nullable();

export const ratingSchema = z
  .number()
  .min(0)
  .max(10)
  .int('Rating must be a whole number');

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Invalid input' };
}

// Sanitize string input (trim and limit length)
export function sanitizeString(input: string | undefined | null, maxLength: number): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}
