import { Router } from 'express';
import { protect, restrictTo } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { createReview } from './review.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import { createReviewSchema } from './review.validation';

const router = Router();

router.use(protect);

router.post('/', restrictTo(Role.CUSTOMER), validateRequest(createReviewSchema), createReview);

export default router;
