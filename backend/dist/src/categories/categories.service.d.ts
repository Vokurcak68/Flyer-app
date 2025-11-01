import { PrismaService } from '../prisma/prisma.service';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findSubcategories(categoryId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
    }[]>;
}
