import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { globalErrorHandler } from './middlewares/error.middleware';
import { AppError } from './utils/AppError';

// Import modular routes
import authRoutes from './modules/auth/auth.routes';
import serviceRoutes from './modules/service/service.routes';
import technicianRoutes from './modules/technician/technician.routes';
import bookingRoutes from './modules/booking/booking.routes';
import paymentRoutes from './modules/payment/payment.routes';
import reviewRoutes from './modules/review/review.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Basic Home Endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the FixItNow Backend API! 🔧',
    documentation: 'See the attached Postman collection for usage instructions.',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', serviceRoutes); // Public browsing endpoints (services, technicians, categories)
app.use('/api/technician', technicianRoutes); // Technician profile & booking management
app.use('/api/bookings', bookingRoutes); // Booking creation and list
app.use('/api/payments', paymentRoutes); // Payments history and status check
app.use('/api/reviews', reviewRoutes); // Customer review submittal
app.use('/api/admin', adminRoutes); // Admin controls

// Unhandled Route (404 Handler)
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler Middleware (MUST be last)
app.use(globalErrorHandler);

export default app;
