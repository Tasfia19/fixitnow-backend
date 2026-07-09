import { Router } from 'express';
import { getServices, getTechnicians, getTechnicianById, getCategories } from './service.controller';

const router = Router();

router.get('/services', getServices);
router.get('/technicians', getTechnicians);
router.get('/technicians/:id', getTechnicianById);
router.get('/categories', getCategories);

export default router;
