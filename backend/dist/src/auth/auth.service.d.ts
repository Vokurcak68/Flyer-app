import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            createdAt: Date;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
        };
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            brands: ({
                brand: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    logoData: Buffer | null;
                    logoMimeType: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                brandId: string;
                userId: string;
            })[];
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            lastLogin: Date | null;
        };
        access_token: string;
    }>;
    validateUser(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        brands: ({
            brand: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
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
        id: string;
        createdAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        lastLogin: Date;
        brands: ({
            brand: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
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
