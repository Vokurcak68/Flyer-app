import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignBrandsDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        brands: {
          include: {
            brand: true,
          },
        },
      },
    });

    // Transform brands from UserBrand[] to Brand[]
    return users.map(user => ({
      ...user,
      brands: user.brands.map(ub => ub.brand),
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        brands: {
          include: {
            brand: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Transform brands from UserBrand[] to Brand[]
    return {
      ...user,
      brands: user.brands.map(ub => ub.brand),
    };
  }

  async create(createUserDto: CreateUserDto) {
    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role,
      },
      include: {
        brands: true,
      },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // If email is being updated, check for conflicts
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Prepare update data
    const updateData: any = { ...updateUserDto };

    // If password is being updated, hash it
    if (updateUserDto.password) {
      delete updateData.password; // Remove password field
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        brands: true,
      },
    });

    return user;
  }

  async remove(id: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Delete user
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  async assignBrands(userId: string, assignBrandsDto: AssignBrandsDto) {
    // Check if user exists and is a supplier
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role !== UserRole.supplier) {
      throw new BadRequestException('Only suppliers can be assigned brands');
    }

    // Verify all brands exist
    const brands = await this.prisma.brand.findMany({
      where: {
        id: { in: assignBrandsDto.brandIds },
      },
    });

    if (brands.length !== assignBrandsDto.brandIds.length) {
      throw new BadRequestException('One or more brands not found');
    }

    // Replace all brands: delete existing and create new ones
    await this.prisma.userBrand.deleteMany({
      where: { userId },
    });

    if (assignBrandsDto.brandIds.length > 0) {
      await this.prisma.userBrand.createMany({
        data: assignBrandsDto.brandIds.map(brandId => ({
          userId,
          brandId,
        })),
      });
    }

    // Return updated user with brands
    const updatedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        brands: {
          include: {
            brand: true,
          },
        },
      },
    });

    // Transform brands from UserBrand[] to Brand[]
    return {
      ...updatedUser,
      brands: updatedUser.brands.map(ub => ub.brand),
    };
  }

  async removeBrand(userId: string, brandId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        brands: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if brand is assigned to user
    const brandAssigned = user.brands.some(brand => brand.id === brandId);

    if (!brandAssigned) {
      throw new BadRequestException('Brand is not assigned to this user');
    }

    // Remove brand from user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        brands: {
          disconnect: { id: brandId },
        },
      },
      include: {
        brands: true,
      },
    });

    return updatedUser;
  }
}
