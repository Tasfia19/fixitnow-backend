import { PrismaClient, Role, UserStatus, BookingStatus, PaymentStatus, PaymentProvider } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed script...');

  // 1) Clean database
  console.log('🧹 Clearing old database records...');
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.technicianProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2) Create service categories
  console.log('Creating categories...');
  const catPlumbing = await prisma.category.create({
    data: { name: 'Plumbing', description: 'Leaky pipes, faucet repairs, water heaters, toilet installations' },
  });
  const catElectrical = await prisma.category.create({
    data: { name: 'Electrical', description: 'Ceiling fans, lighting fixtures, wiring, outlets, fuse boxes' },
  });
  const catCleaning = await prisma.category.create({
    data: { name: 'Cleaning', description: 'Full home deep cleaning, kitchen sanitation, vacuuming, window washing' },
  });
  const catPainting = await prisma.category.create({
    data: { name: 'Painting', description: 'Interior walls, exterior siding, deck staining, trim painting' },
  });

  // 3) Create Admin user
  console.log('Creating Admin account...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fixitnow.com',
      password: adminPassword,
      name: 'System Administrator',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // 4) Create Customer users
  console.log('Creating Customer accounts...');
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@fixitnow.com',
      password: customerPassword,
      name: 'John Doe',
      role: Role.CUSTOMER,
    },
  });
  const customer2 = await prisma.user.create({
    data: {
      email: 'tasfi@fixitnow.com',
      password: customerPassword,
      name: 'Tasfi Ahmed',
      role: Role.CUSTOMER,
    },
  });

  // 5) Create Technician users and profiles
  console.log('Creating Technician accounts & profiles...');
  const technicianPassword = await bcrypt.hash('tech123', 12);

  // Plumber
  const techUser1 = await prisma.user.create({
    data: {
      email: 'plumber@fixitnow.com',
      password: technicianPassword,
      name: 'Mario Bros',
      role: Role.TECHNICIAN,
    },
  });
  const plumberProfile = await prisma.technicianProfile.create({
    data: {
      userId: techUser1.id,
      skills: ['Pipe repair', 'Leak detection', 'Water heater setup', 'Drain unclogging'],
      experience: 8,
      bio: 'Professional plumber with over 8 years of experience. Quick, clean, and reliable.',
      pricePerHour: 45.0,
      location: 'New York',
      rating: 4.8,
      availability: ['Monday 09:00-17:00', 'Wednesday 09:00-17:00', 'Friday 09:00-17:00'],
    },
  });

  // Electrician
  const techUser2 = await prisma.user.create({
    data: {
      email: 'electrician@fixitnow.com',
      password: technicianPassword,
      name: 'Nikola Tesla',
      role: Role.TECHNICIAN,
    },
  });
  const electricianProfile = await prisma.technicianProfile.create({
    data: {
      userId: techUser2.id,
      skills: ['Circuit wiring', 'Outlet replacements', 'Fixture installation', 'Fault troubleshooting'],
      experience: 12,
      bio: 'Licensed electrical contractor. Safe, fast service for all residential requirements.',
      pricePerHour: 55.0,
      location: 'New York',
      rating: 5.0,
      availability: ['Tuesday 08:00-16:00', 'Thursday 08:00-16:00', 'Saturday 10:00-15:00'],
    },
  });

  // 6) Create Services for Technicians
  console.log('Creating Services...');
  const svcFaucet = await prisma.service.create({
    data: {
      name: 'Leaky Faucet & Pipe Repair',
      description: 'Fixing dripping taps, pipeline leaks, and replacing worn out washers/valves.',
      price: 90.0,
      categoryId: catPlumbing.id,
      technicianProfileId: plumberProfile.id,
    },
  });

  const svcHeater = await prisma.service.create({
    data: {
      name: 'Water Heater Installation',
      description: 'Full swap-out and assembly of modern residential gas or electric water heaters.',
      price: 250.0,
      categoryId: catPlumbing.id,
      technicianProfileId: plumberProfile.id,
    },
  });

  const svcWiring = await prisma.service.create({
    data: {
      name: 'Ceiling Fan & Light Wiring',
      description: 'Installing and wiring ceiling fans, spotlights, chandeliers, and wall sconces.',
      price: 110.0,
      categoryId: catElectrical.id,
      technicianProfileId: electricianProfile.id,
    },
  });

  // 7) Create seed bookings to show in history
  console.log('Creating sample bookings...');
  
  // Booking 1: Requested
  await prisma.booking.create({
    data: {
      customerId: customer1.id,
      technicianId: plumberProfile.id,
      serviceId: svcFaucet.id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      status: BookingStatus.REQUESTED,
    },
  });

  // Booking 2: Completed (with Payment and Review)
  const completedBooking = await prisma.booking.create({
    data: {
      customerId: customer2.id,
      technicianId: electricianProfile.id,
      serviceId: svcWiring.id,
      scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: BookingStatus.COMPLETED,
    },
  });

  // Payment for Booking 2
  await prisma.payment.create({
    data: {
      bookingId: completedBooking.id,
      amount: 110.0,
      transactionId: 'txn_seeding_test_123456',
      method: 'card',
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000),
    },
  });

  // Review for Booking 2
  await prisma.review.create({
    data: {
      bookingId: completedBooking.id,
      customerId: customer2.id,
      technicianId: electricianProfile.id,
      rating: 5,
      comment: 'Excellent wiring work! Nikola was professional, neat, and highly knowledgeable.',
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log(`
  Credentials Seeded:
  -------------------------------------------------------------
  Role        | Email                      | Password
  -------------------------------------------------------------
  Admin       | admin@fixitnow.com         | admin123
  Customer    | customer@fixitnow.com      | customer123
  Customer 2  | tasfi@fixitnow.com         | customer123
  Technician  | plumber@fixitnow.com       | tech123 (Mario Bros)
  Technician 2| electrician@fixitnow.com   | tech123 (Nikola Tesla)
  -------------------------------------------------------------
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
