import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findSubcategories(categoryId: string) {
    return this.prisma.subcategory.findMany({
      where: {
        categoryId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
