import { Response, NextFunction } from 'express';
import prisma from '../../services/db';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { UserStatus } from '@prisma/client';

export const getUsers = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      technicianProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    message: 'All users retrieved successfully',
    data: { users },
  });
});

export const updateUserStatus = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status } = req.body;
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return next(new AppError('Invalid user id', 400));
  if (status !== UserStatus.ACTIVE && status !== UserStatus.BANNED) {
    return next(new AppError('Invalid user status. Must be ACTIVE or BANNED.', 400));
  }

  if (idNum === req.user!.id) {
    return next(new AppError('You cannot ban your own administrator account', 400));
  }

  const user = await prisma.user.findUnique({ where: { id: idNum } });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const updatedUser = await prisma.user.update({
    where: { id: idNum },
    data: { status },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  res.status(200).json({
    success: true,
    message: `User status updated to ${status} successfully`,
    data: { user: updatedUser },
  });
});

export const getAllBookings = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const bookings = await prisma.booking.findMany({
    include: {
      service: true,
      customer: { select: { id: true, name: true, email: true } },
      technician: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    message: 'All platform bookings retrieved successfully',
    data: { bookings },
  });
});

export const getAllCategories = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { services: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.status(200).json({
    success: true,
    message: 'All categories retrieved successfully',
    data: { categories },
  });
});

export const createCategory = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { name, description } = req.body;

  const existingCategory = await prisma.category.findUnique({ where: { name } });
  if (existingCategory) {
    return next(new AppError('Category with this name already exists', 400));
  }

  const category = await prisma.category.create({
    data: {
      name,
      description,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Service category created successfully',
    data: { category },
  });
});
