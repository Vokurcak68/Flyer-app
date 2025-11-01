import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        user: {
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            isActive: boolean;
            createdAt: Date;
        };
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            brands: ({
                brand: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    logoData: Buffer | null;
                    logoMimeType: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                brandId: string;
                userId: string;
            })[];
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            lastLogin: Date | null;
        };
        access_token: string;
    }>;
    validateUser(userId: string): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
        brands: ({
            brand: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                logoData: Buffer | null;
                logoMimeType: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            brandId: string;
            userId: string;
        })[];
    }>;
    private generateToken;
    getProfile(userId: string): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
        createdAt: Date;
        lastLogin: Date;
        brands: ({
            brand: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                logoData: Buffer | null;
                logoMimeType: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            brandId: string;
            userId: string;
        })[];
    }>;
}
