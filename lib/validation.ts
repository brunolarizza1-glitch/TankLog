import { z } from 'zod';
import { ValidationError } from './errors';

/**
 * Common validation schemas and utilities for API routes
 *
 * This module provides Zod schemas and validation utilities for
 * consistent input validation across all API endpoints.
 */

// Log creation validation
export const createLogSchema = z.object({
  site: z.string().max(255, 'Site name too long').optional(),
  vehicle_id: z.string().max(100, 'Vehicle ID too long').optional(),
  tank_id: z
    .string()
    .min(1, 'Tank ID is required')
    .max(100, 'Tank ID too long'),
  pressure: z.string().max(20, 'Pressure value too long').optional(),
  leak_check: z.boolean(),
  visual_ok: z.boolean().optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  corrective_action: z
    .string()
    .max(1000, 'Corrective action too long')
    .optional(),
  customer_email: z.string().email('Invalid email format').optional(),
  compliance_mode: z.enum(['US_NFPA58', 'CA_TSSA']).optional(),
  photo_urls: z
    .array(z.string().url('Invalid photo URL'))
    .max(10, 'Too many photos')
    .optional(),
  initials: z
    .string()
    .min(2, 'Initials must be at least 2 characters')
    .max(3, 'Initials must be at most 3 characters'),
});

// Organization update validation
export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(255, 'Name too long'),
  logo_url: z.string().url('Invalid logo URL').optional(),
});

// Compliance mode validation
export const complianceModeSchema = z.object({
  compliance_mode: z.enum(['US_NFPA58', 'CA_TSSA'], {
    errorMap: () => ({ message: 'Invalid compliance mode' }),
  }),
});

// Profile update validation
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  email: z.string().email('Invalid email format'),
});

// Photo upload validation
export const photoUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  orgId: z.string().uuid('Invalid organization ID'),
});

// Magic link validation
export const magicLinkSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * Validate request body against a schema
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', details);
    }
    throw error;
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  params: URLSearchParams
): T {
  const obj = Object.fromEntries(params.entries());
  return validateRequestBody(schema, obj);
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: unknown,
  maxSize: number = 5 * 1024 * 1024, // 5MB default
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): File {
  if (!(file instanceof File)) {
    throw new ValidationError('File is required');
  }

  if (file.size > maxSize) {
    throw new ValidationError(
      `File size must be less than ${maxSize / 1024 / 1024}MB`
    );
  }

  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(
      `File type must be one of: ${allowedTypes.join(', ')}`
    );
  }

  return file;
}
