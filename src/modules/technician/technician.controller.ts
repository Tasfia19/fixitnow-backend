import { Response, NextFunction } from 'express';
import prisma from '../../services/db';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export const updateTechnicianProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { skills, experience, bio, pricePerHour, location, availability } = req.body;

  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return next(new AppError('Technician profile not found', 404));
  }

  const updatedProfile = await prisma.technicianProfile.update({
    where: { userId },
    data: {
      skills,
      experience,
      bio,
      pricePerHour,
      location,
      ...(availability && { availability }),
    },
  });

  res.status(200).json({
    success: true,
    message: 'Technician profile updated successfully',
    data: { profile: updatedProfile },
  });
});

export const updateAvailability = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { availability } = req.body;

  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return next(new AppError('Technician profile not found', 404));
  }

  const updatedProfile = await prisma.technicianProfile.update({
    where: { userId },
    data: { availability },
  });

  res.status(200).json({
    success: true,
    message: 'Technician availability updated successfully',
    data: { availability: updatedProfile.availability },
  });
});

export const createService = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { name, description, price, categoryId } = req.body;

  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return next(new AppError('Technician profile not found. Please complete profile first.', 404));
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  const service = await prisma.service.create({
    data: {
      name,
      description,
      price,
      categoryId,
      technicianProfileId: profile.id,
    },
    include: {
      category: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Service registered successfully',
    data: { service },
  });
});

export const getMyServices = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;

  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return next(new AppError('Technician profile not found', 404));
  }

  const services = await prisma.service.findMany({
    where: { technicianProfileId: profile.id },
    include: { category: true },
  });

  res.status(200).json({
    success: true,
    message: 'Technician services retrieved successfully',
    data: { services },
  });
});

export const deleteService = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return next(new AppError('Invalid service id', 400));
  }
  const userId = req.user!.id;

  const service = await prisma.service.findUnique({
    where: { id },
    include: { technicianProfile: true },
  });

  if (!service) {
    return next(new AppError('Service not found', 404));
  }

  if (service.technicianProfile.userId !== userId) {
    return next(new AppError('You are not authorized to delete this service', 403));
  }

  await prisma.service.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'Service deleted successfully',
  });
});
