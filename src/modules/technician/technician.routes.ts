import { Router } from 'express';
import { protect, restrictTo } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import {
  updateTechnicianProfile,
  updateAvailability,
  createService,
  getMyServices,
  deleteService,
} from './technician.controller';
import { getTechnicianBookings, updateBookingStatus } from '../booking/booking.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import { technicianProfileSchema, updateAvailabilitySchema } from './technician.validation';

const router = Router();

router.use(protect);
router.use(restrictTo(Role.TECHNICIAN));

router.put('/profile', validateRequest(technicianProfileSchema), updateTechnicianProfile);
router.put('/availability', validateRequest(updateAvailabilitySchema), updateAvailability);
router.route('/services')
  .post(createService)
  .get(getMyServices);
router.delete('/services/:id', deleteService);

router.get('/bookings', getTechnicianBookings);
router.patch('/bookings/:id', updateBookingStatus);

export default router;
