import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetails = err.errorDetails || null;

  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = err.errors.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }

  // Handle Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint failed
    if (err.code === 'P2002') {
      statusCode = 400;
      const fields = (err.meta?.target as string[]) || [];
      message = `Duplicate field value: ${fields.join(', ')}. Please use another value!`;
      errorDetails = err.meta;
    }
    // Record not found
    else if (err.code === 'P2025') {
      statusCode = 404;
      message = err.meta?.cause as string || 'Record not found';
      errorDetails = err.meta;
    }
    // Foreign key constraint failed
    else if (err.code === 'P2003') {
      statusCode = 400;
      message = `Invalid reference: ${err.meta?.field_name || 'foreign key'}`;
      errorDetails = err.meta;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again!';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again!';
  }

  // Log unexpected errors for developers
  if (statusCode === 500) {
    console.error('ERROR 💥:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
  });
};
