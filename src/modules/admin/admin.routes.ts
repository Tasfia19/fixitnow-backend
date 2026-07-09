import { Router } from 'express';
import { protect, restrictTo } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import {
  getUsers,
  updateUserStatus,
  getAllBookings,
  getAllCategories,
  createCategory,
} from './admin.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import { createCategorySchema } from './admin.validation';

const router = Router();

router.use(protect);
router.use(restrictTo(Role.ADMIN));

router.get('/users', getUsers);
router.patch('/users/:id', updateUserStatus);
router.get('/bookings', getAllBookings);
router.get('/categories', getAllCategories);
router.post('/categories', validateRequest(createCategorySchema), createCategory);

export default router;
