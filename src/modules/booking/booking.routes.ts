import { Router } from 'express';
import { protect, restrictTo } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { createBooking, getBookings, getBookingById, cancelBooking } from './booking.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import { createBookingSchema } from './booking.validation';

const router = Router();

router.use(protect);

router.post('/', restrictTo(Role.CUSTOMER), validateRequest(createBookingSchema), createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.patch('/:id/cancel', cancelBooking);

export default router;
