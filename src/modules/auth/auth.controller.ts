import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../services/db';
import { AppError } from '../../utils/AppError';
import { catchAsync } from '../../utils/catchAsync';
import { config } from '../../config';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const signToken = (id: string | number) => {
  return jwt.sign({ id: String(id) }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

export const register = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { email, password, name, role } = req.body;

  // 1) Check if email exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return next(new AppError('Email address is already in use.', 400));
  }

  // 2) Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3) Create user inside a transaction
  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    // If registering as a technician, initialize their profile
    if (role === Role.TECHNICIAN) {
      await tx.technicianProfile.create({
        data: {
          userId: user.id,
          skills: [],
          experience: 0,
          bio: '',
          pricePerHour: 0.0,
          location: '',
          availability: [],
        },
      });
    }

    return user;
  });

  // 4) Generate JWT token
  const token = signToken(newUser.id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
      },
    },
  });
});

export const login = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Find user and verify password
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Check if user is banned
  if (user.status === 'BANNED') {
    return next(new AppError('Your account has been banned. Please contact administration.', 403));
  }

  // 4) Generate JWT
  const token = signToken(user.id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    },
  });
});

export const getMe = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      technicianProfile: true,
    },
  });

  res.status(200).json({
    success: true,
    message: 'User details fetched successfully',
    data: { user },
  });
});
