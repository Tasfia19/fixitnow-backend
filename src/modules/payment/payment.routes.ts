import { Router } from 'express';
import { protect, restrictTo } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { createPaymentSession, confirmPayment, getPaymentHistory, getPaymentDetails } from './payment.controller';

const router = Router();

router.use(protect);

router.post('/create', restrictTo(Role.CUSTOMER), createPaymentSession);
router.post('/confirm', confirmPayment);
router.get('/', getPaymentHistory);
router.get('/:id', getPaymentDetails);

export default router;
