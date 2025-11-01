import { PrismaService } from '../prisma/prisma.service';
import { CreateIconDto } from './dto/create-icon.dto';
import { UpdateIconDto } from './dto/update-icon.dto';
export declare class IconsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createIconDto: CreateIconDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        imageData: Buffer;
        imageMimeType: string;
    }>;
    findAll(): Promise<{
        imageData: any;
        imageUrl: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        imageMimeType: string;
    }[]>;
    findOne(id: string): Promise<{
        imageData: any;
        imageUrl: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        imageMimeType: string;
    }>;
    getImage(id: string): Promise<{
        data: Buffer;
        mimeType: string;
    }>;
    update(id: string, updateIconDto: UpdateIconDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        imageData: Buffer;
        imageMimeType: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        imageData: Buffer;
        imageMimeType: string;
    }>;
}
