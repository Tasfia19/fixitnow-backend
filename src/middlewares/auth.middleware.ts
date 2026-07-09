import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import prisma from '../services/db';
import { Role, User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const protect = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // 1) Getting token and check if it's there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verification token
  const decoded = jwt.verify(token, config.jwtSecret) as { id: string | number };
  const userId = typeof decoded.id === 'string' ? Number(decoded.id) : decoded.id;

  // 3) Check if user still exists
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4) Check if user is banned
  if (currentUser.status === 'BANNED') {
    return next(new AppError('Your account has been banned. Please contact administration.', 403));
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});

export const restrictTo = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};
