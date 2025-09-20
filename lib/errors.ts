/**
 * Standardized error handling utilities for TankLog
 * 
 * This module provides custom error classes and utilities for consistent
 * error handling across the application.
 */

/**
 * Base error class for all TankLog-specific errors
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 * @param statusCode - HTTP status code for API responses
 * @param details - Additional error details for debugging
 */
export class TankLogError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TankLogError';
  }
}

export class ValidationError extends TankLogError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends TankLogError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends TankLogError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends TankLogError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends TankLogError {
  constructor(message: string, details?: unknown) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Handle errors and return appropriate HTTP responses
 */
export function handleError(error: unknown): {
  statusCode: number;
  message: string;
  code?: string;
  details?: unknown;
} {
  if (error instanceof TankLogError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    };
  }

  return {
    statusCode: 500,
    message: 'Internal server error',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Safe error logging for production
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'ERROR'}]`, error);
  }
  // In production, you might want to send to a logging service
}
