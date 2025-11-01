import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignBrandsDto } from './dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    findOne(id: string, req: any): Promise<{
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
    assignBrands(id: string, assignBrandsDto: AssignBrandsDto): Promise<{
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
    removeBrand(id: string, brandId: string): Promise<{
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
