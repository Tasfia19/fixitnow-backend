import { Response, NextFunction } from 'express';
import prisma from '../../services/db';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { Role, BookingStatus } from '@prisma/client';

export const createBooking = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { serviceId, scheduledAt } = req.body;
  const customerId = req.user!.id;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { technicianProfile: true },
  });

  if (!service) {
    return next(new AppError('Service not found', 404));
  }

  const technicianId = service.technicianProfile.id;

  const booking = await prisma.booking.create({
    data: {
      customerId,
      technicianId,
      serviceId,
      scheduledAt: new Date(scheduledAt),
      status: BookingStatus.REQUESTED,
    },
    include: {
      service: true,
      technician: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Booking request created successfully',
    data: { booking },
  });
});

export const getBookings = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const role = req.user!.role;

  let where: any = {};

  if (role === Role.CUSTOMER) {
    where.customerId = userId;
  } else if (role === Role.TECHNICIAN) {
    where.technician = { userId };
  } else if (role === Role.ADMIN) {
    where = {};
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      service: {
        include: { category: true },
      },
      customer: {
        select: { id: true, name: true, email: true },
      },
      technician: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      payment: true,
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    message: 'Bookings retrieved successfully',
    data: { bookings },
  });
});

export const getBookingById = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const role = req.user!.role;

  const booking = await prisma.booking.findUnique({
    where: {     id: Number(req.params.id) },
    include: {
      service: {
        include: { category: true },
      },
      customer: {
        select: { id: true, name: true, email: true },
      },
      technician: {
        include: {
          user: { select: { id: true, name: true, email: true, status: true } },
        },
      },
      payment: true,
      review: true,
    },
  });

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  const isAuthorizedCustomer = booking.customerId === userId;
  const isAuthorizedTechnician = booking.technician.userId === userId;
  const isAuthorizedAdmin = role === Role.ADMIN;

  if (!isAuthorizedCustomer && !isAuthorizedTechnician && !isAuthorizedAdmin) {
    return next(new AppError('You are not authorized to view this booking', 403));
  }

  res.status(200).json({
    success: true,
    message: 'Booking details retrieved successfully',
    data: { booking },
  });
});

export const cancelBooking = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const booking = await prisma.booking.findUnique({
    where: {     id: Number(req.params.id) },
    include: {
      technician: true,
    },
  });

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  const isAuthorizedCustomer = booking.customerId === userId;
  const isAuthorizedAdmin = req.user!.role === Role.ADMIN;

  if (!isAuthorizedCustomer && !isAuthorizedAdmin) {
    return next(new AppError('You are not authorized to cancel this booking', 403));
  }

  const nonCancellableStates: BookingStatus[] = [BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED, BookingStatus.CANCELLED];
  if (nonCancellableStates.includes(booking.status)) {
    return next(new AppError(`Cannot cancel booking once it is ${booking.status.toLowerCase()}`, 400));
  }

  const updatedBooking = await prisma.booking.update({
    where: {     id: Number(req.params.id)   },
    data: { status: BookingStatus.CANCELLED },
  });

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: { booking: updatedBooking },
  });
});

export const updateBookingStatus = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user!.id;

  const booking = await prisma.booking.findUnique({
    where: {     id: Number(req.params.id) },
    include: {
      technician: true,
      payment: true,
    },
  });

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (booking.technician.userId !== userId) {
    return next(new AppError('You are not authorized to manage this booking', 403));
  }

  const validStatuses = [
    BookingStatus.ACCEPTED,
    BookingStatus.DECLINED,
    BookingStatus.IN_PROGRESS,
    BookingStatus.COMPLETED,
  ];

  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid booking status update', 400));
  }

  if (status === BookingStatus.ACCEPTED && booking.status !== BookingStatus.REQUESTED) {
    return next(new AppError('Can only accept requested bookings', 400));
  }

  if (status === BookingStatus.DECLINED && booking.status !== BookingStatus.REQUESTED) {
    return next(new AppError('Can only decline requested bookings', 400));
  }

  if (status === BookingStatus.IN_PROGRESS && booking.status !== BookingStatus.PAID) {
    return next(new AppError('Can only start in-progress jobs after they have been paid', 400));
  }

  if (status === BookingStatus.COMPLETED && booking.status !== BookingStatus.IN_PROGRESS) {
    return next(new AppError('Can only complete jobs that are currently in progress', 400));
  }

  const updatedBooking = await prisma.booking.update({
    where: {     id: Number(req.params.id) },
    data: { status },
  });

  res.status(200).json({
    success: true,
    message: `Booking status updated to ${status} successfully`,
    data: { booking: updatedBooking },
  });
});

export const getTechnicianBookings = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;

  const bookings = await prisma.booking.findMany({
    where: {
      technician: { userId },
    },
    include: {
      service: true,
      customer: {
        select: { id: true, name: true, email: true },
      },
      payment: true,
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    message: 'Technician bookings retrieved successfully',
    data: { bookings },
  });
});
