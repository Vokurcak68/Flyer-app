import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignBrandsDto } from './dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        brands: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            logoData: Buffer | null;
            logoMimeType: string | null;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        passwordHash: string;
        isActive: boolean;
        lastLogin: Date | null;
    }[]>;
    findOne(id: string, req: any): Promise<{
        brands: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            logoData: Buffer | null;
            logoMimeType: string | null;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        passwordHash: string;
        isActive: boolean;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        passwordHash: string;
        isActive: boolean;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        passwordHash: string;
        isActive: boolean;
        lastLogin: Date | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    assignBrands(id: string, assignBrandsDto: AssignBrandsDto): Promise<{
        brands: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            logoData: Buffer | null;
            logoMimeType: string | null;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        passwordHash: string;
        isActive: boolean;
        lastLogin: Date | null;
    }>;
    removeBrand(id: string, brandId: string): Promise<{
        brands: {
            id: string;
            createdAt: Date;
            brandId: string;
            userId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        passwordHash: string;
        isActive: boolean;
        lastLogin: Date | null;
    }>;
}
