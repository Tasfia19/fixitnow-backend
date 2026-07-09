import { Router } from 'express';
import { register, login, getMe } from './auth.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import { registerSchema, loginSchema } from './auth.validation';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.get('/me', protect, getMe);

export default router;
