import { Request, Response, NextFunction } from 'express';
import prisma from '../../services/db';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';

export const getServices = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { categoryId, location, rating, priceMin, priceMax, search } = req.query;

  const where: any = {};

  if (categoryId) {
    where.categoryId = String(categoryId);
  }

  if (search) {
    where.name = {
      contains: String(search),
      mode: 'insensitive',
    };
  }

  if (priceMin || priceMax) {
    where.price = {};
    if (priceMin) where.price.gte = parseFloat(String(priceMin));
    if (priceMax) where.price.lte = parseFloat(String(priceMax));
  }

  if (location || rating) {
    where.technicianProfile = {};
    if (location) {
      where.technicianProfile.location = {
        contains: String(location),
        mode: 'insensitive',
      };
    }
    if (rating) {
      where.technicianProfile.rating = {
        gte: parseFloat(String(rating)),
      };
    }
  }

  const services = await prisma.service.findMany({
    where,
    include: {
      category: true,
      technicianProfile: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Services retrieved successfully',
    data: { services },
  });
});

export const getTechnicians = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { location, rating, skills, priceMin, priceMax, search } = req.query;

  const where: any = {
    user: {
      status: 'ACTIVE',
    },
  };

  if (location) {
    where.location = {
      contains: String(location),
      mode: 'insensitive',
    };
  }

  if (rating) {
    where.rating = {
      gte: parseFloat(String(rating)),
    };
  }

  if (skills) {
    where.skills = {
      hasSome: String(skills).split(','),
    };
  }

  if (priceMin || priceMax) {
    where.pricePerHour = {};
    if (priceMin) where.pricePerHour.gte = parseFloat(String(priceMin));
    if (priceMax) where.pricePerHour.lte = parseFloat(String(priceMax));
  }

  if (search) {
    where.user = {
      ...where.user,
      name: {
        contains: String(search),
        mode: 'insensitive',
      },
    };
  }

  const technicians = await prisma.technicianProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        },
      },
      services: {
        include: {
          category: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Technicians retrieved successfully',
    data: { technicians },
  });
});

export const getTechnicianById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const technician = await prisma.technicianProfile.findUnique({
    where: {     id: Number(req.params.id) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      services: {
        include: {
          category: true,
        },
      },
      reviews: {
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!technician) {
    return next(new AppError('Technician not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Technician retrieved successfully',
    data: { technician },
  });
});

export const getCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { services: true },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: { categories },
  });
});
