import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
                    color: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                brandId: string;
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
    getProfile(req: any): Promise<{
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
                color: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            brandId: string;
        })[];
    }>;
    validate(req: any): Promise<{
        valid: boolean;
        user: any;
    }>;
}
