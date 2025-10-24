import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignBrandsDto } from './dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        brands: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            logoData: Buffer | null;
            logoMimeType: string | null;
        }[];
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        passwordHash: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        lastLogin: Date | null;
    }[]>;
    findOne(id: string): Promise<{
        brands: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            logoData: Buffer | null;
            logoMimeType: string | null;
        }[];
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        passwordHash: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        lastLogin: Date | null;
    }>;
    create(createUserDto: CreateUserDto): Promise<{
        brands: {
            id: string;
            createdAt: Date;
            brandId: string;
            userId: string;
        }[];
    } & {
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        passwordHash: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        lastLogin: Date | null;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        brands: {
            id: string;
            createdAt: Date;
            brandId: string;
            userId: string;
        }[];
    } & {
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        passwordHash: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        lastLogin: Date | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    assignBrands(userId: string, assignBrandsDto: AssignBrandsDto): Promise<{
        brands: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            logoData: Buffer | null;
            logoMimeType: string | null;
        }[];
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        passwordHash: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        lastLogin: Date | null;
    }>;
    removeBrand(userId: string, brandId: string): Promise<{
        brands: {
            id: string;
            createdAt: Date;
            brandId: string;
            userId: string;
        }[];
    } & {
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        passwordHash: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        lastLogin: Date | null;
    }>;
}
