import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    serviceId: z
      .number({
        required_error: 'Service ID is required',
        invalid_type_error: 'Service ID must be a number',
      })
      .int()
      .positive(),

    scheduledAt: z
      .string({
        required_error: 'Scheduled date is required',
      })
      .datetime('Scheduled date must be a valid ISO datetime string'),
  }),
});