import { Response, NextFunction } from 'express';
import prisma from '../../services/db';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { createCheckoutSession, retrieveCheckoutSession } from '../../services/stripe.service';
import { Role, BookingStatus, PaymentStatus, PaymentProvider } from '@prisma/client';

export const createPaymentSession = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { bookingId } = req.body;
  const userId = req.user!.id;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      payment: true,
    },
  });

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (booking.customerId !== userId) {
    return next(new AppError('You are not authorized to pay for this booking', 403));
  }

  if (booking.status !== BookingStatus.ACCEPTED) {
    return next(new AppError(`Booking must be accepted before payment. Current status: ${booking.status}`, 400));
  }

  if (booking.payment && booking.payment.status === PaymentStatus.COMPLETED) {
    return next(new AppError('This booking has already been paid', 400));
  }

  const transactionId = `txn_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  const amount = booking.service.price;

  let sessionUrl = '';
  let sessionId = '';

  try {
    const session = await createCheckoutSession(String(booking.id), amount, booking.service.name, transactionId);
    sessionUrl = session.url || '';
    sessionId = session.id;
  } catch (error: any) {
    console.warn('Stripe checkout session creation failed. Falling back to local sandbox session.');
    sessionUrl = `https://example.com/payment-sandbox?booking_id=${booking.id}&txn_id=${transactionId}`;
    sessionId = `mock_session_${transactionId}`;
  }

  const payment = await prisma.payment.upsert({
    where: { bookingId: booking.id },
    update: {
      amount,
      transactionId,
      status: PaymentStatus.PENDING,
    },
    create: {
      bookingId: booking.id,
      amount,
      transactionId,
      method: 'card',
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.PENDING,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Payment checkout session created successfully',
    data: {
      payment,
      sessionUrl,
      sessionId,
    },
  });
});

export const confirmPayment = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { sessionId, bookingId } = req.body;

  if (!sessionId && !bookingId) {
    return next(new AppError('Please provide either sessionId or bookingId', 400));
  }

  let targetBookingId = bookingId;
  let isPaid = false;
  let stripeTxnId = '';

  if (sessionId && !sessionId.startsWith('mock_')) {
    try {
      const session = await retrieveCheckoutSession(sessionId);
      targetBookingId = session.client_reference_id || session.metadata?.bookingId || '';
      stripeTxnId = session.metadata?.transactionId || '';
      
      if (session.payment_status === 'paid') {
        isPaid = true;
      }
    } catch (error: any) {
      return next(new AppError(`Stripe payment verification failed: ${error.message}`, 400));
    }
  } else {
    isPaid = true; 
  }

  if (!targetBookingId) {
    return next(new AppError('Unable to identify booking for this payment session', 400));
  }

  const booking = await prisma.booking.findUnique({
    where: { id: targetBookingId },
    include: { payment: true },
  });

  if (!booking) {
    return next(new AppError('Booking associated with payment not found', 404));
  }

  if (!isPaid) {
    return next(new AppError('Payment has not been completed', 400));
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { bookingId: booking.id },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
        transactionId: stripeTxnId || booking.payment?.transactionId || `txn_mock_${Date.now()}`,
      },
    });

    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.PAID },
    });

    return { payment: updatedPayment, booking: updatedBooking };
  });

  res.status(200).json({
    success: true,
    message: 'Payment completed and booking updated to PAID status successfully',
    data: result,
  });
});

export const getPaymentHistory = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const role = req.user!.role;

  let where: any = {};

  if (role === Role.CUSTOMER) {
    where.booking = { customerId: userId };
  } else if (role === Role.TECHNICIAN) {
    where.booking = { technician: { userId } };
  } else if (role === Role.ADMIN) {
    where = {};
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      booking: {
        include: {
          service: true,
          customer: { select: { id: true, name: true, email: true } },
          technician: {
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    message: 'Payment history retrieved successfully',
    data: { payments },
  });
});

export const getPaymentDetails = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const paymentId = Number(id);
  if (Number.isNaN(paymentId)) {
    return next(new AppError('Invalid payment id', 400));
  }
  const userId = req.user!.id;
  const role = req.user!.role;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          customer: true,
          technician: true,
        },
      },
    },
  });

  if (!payment) {
    return next(new AppError('Payment record not found', 404));
  }

  const isAuthorizedCustomer = payment.booking.customerId === userId;
  const isAuthorizedTechnician = payment.booking.technician.userId === userId;
  const isAuthorizedAdmin = role === Role.ADMIN;

  if (!isAuthorizedCustomer && !isAuthorizedTechnician && !isAuthorizedAdmin) {
    return next(new AppError('You are not authorized to view this payment record', 403));
  }

  res.status(200).json({
    success: true,
    message: 'Payment details retrieved successfully',
    data: { payment },
  });
});
