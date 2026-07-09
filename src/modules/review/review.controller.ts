import { Response, NextFunction } from 'express';
import prisma from '../../services/db';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { BookingStatus } from '@prisma/client';

export const createReview = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { bookingId, rating, comment } = req.body;
  const customerId = req.user!.id;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (booking.customerId !== customerId) {
    return next(new AppError('You can only review bookings you have booked', 403));
  }

  if (booking.status !== BookingStatus.COMPLETED) {
    return next(new AppError('You can only review technicians after the job is completed', 400));
  }

  if (booking.review) {
    return next(new AppError('You have already submitted a review for this booking', 400));
  }

  const review = await prisma.$transaction(async (tx) => {
    const newReview = await tx.review.create({
      data: {
        bookingId,
        customerId,
        technicianId: booking.technicianId,
        rating,
        comment,
      },
    });

    const agg = await tx.review.aggregate({
      where: { technicianId: booking.technicianId },
      _avg: { rating: true },
    });

    const averageRating = agg._avg.rating || 0;

    await tx.technicianProfile.update({
      where: { id: booking.technicianId },
      data: { rating: averageRating },
    });

    return newReview;
  });

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: { review },
  });
});
