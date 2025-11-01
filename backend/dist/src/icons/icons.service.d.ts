import { PrismaService } from '../prisma/prisma.service';
import { CreateIconDto } from './dto/create-icon.dto';
import { UpdateIconDto } from './dto/update-icon.dto';
export declare class IconsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createIconDto: CreateIconDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageData: Buffer;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
    findAll(): Promise<{
        imageData: any;
        imageUrl: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageMimeType: string;
        isEnergyClass: boolean;
    }[]>;
    findOne(id: string): Promise<{
        imageData: any;
        imageUrl: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
    getImage(id: string): Promise<{
        data: Buffer;
        mimeType: string;
    }>;
    update(id: string, updateIconDto: UpdateIconDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageData: Buffer;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageData: Buffer;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
}
