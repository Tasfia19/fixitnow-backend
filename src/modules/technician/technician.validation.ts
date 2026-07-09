import { z } from 'zod';

export const technicianProfileSchema = z.object({
  body: z.object({
    skills: z.array(z.string()).min(1, 'At least one skill is required'),
    experience: z.number({ required_error: 'Experience is required' }).int().nonnegative('Experience cannot be negative'),
    bio: z.string().optional(),
    pricePerHour: z.number({ required_error: 'Price per hour is required' }).positive('Price per hour must be a positive number'),
    location: z.string({ required_error: 'Location is required' }).min(2, 'Location must be at least 2 characters long'),
    availability: z.array(z.string()).optional(),
  }),
});

export const updateAvailabilitySchema = z.object({
  body: z.object({
    availability: z.array(z.string({ required_error: 'Availability slot must be a string' })).min(1, 'At least one availability slot is required'),
  }),
});
