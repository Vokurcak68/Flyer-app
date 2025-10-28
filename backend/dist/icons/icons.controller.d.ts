import { Response } from 'express';
import { IconsService } from './icons.service';
import { CreateIconDto } from './dto/create-icon.dto';
import { UpdateIconDto } from './dto/update-icon.dto';
export declare class IconsController {
    private readonly iconsService;
    constructor(iconsService: IconsService);
    create(createIconDto: CreateIconDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        imageData: Buffer;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
    findAll(): Promise<{
        imageData: any;
        imageUrl: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        imageMimeType: string;
        isEnergyClass: boolean;
    }[]>;
    findOne(id: string): Promise<{
        imageData: any;
        imageUrl: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
    getImage(id: string, res: Response): Promise<void>;
    update(id: string, updateIconDto: UpdateIconDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        imageData: Buffer;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        imageData: Buffer;
        imageMimeType: string;
        isEnergyClass: boolean;
    }>;
}
