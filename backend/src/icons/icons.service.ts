import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIconDto } from './dto/create-icon.dto';
import { UpdateIconDto } from './dto/update-icon.dto';

@Injectable()
export class IconsService {
  constructor(private prisma: PrismaService) {}

  async create(createIconDto: CreateIconDto) {
    const { imageData, ...rest } = createIconDto;
    const imageBuffer = Buffer.from(imageData, 'base64');

    return this.prisma.icon.create({
      data: {
        ...rest,
        imageData: imageBuffer,
      },
    });
  }

  async findAll() {
    const icons = await this.prisma.icon.findMany({
      orderBy: { name: 'asc' },
    });

    const baseUrl = process.env.API_URL || 'http://localhost:4000';

    return icons.map(icon => ({
      ...icon,
      imageData: undefined, // Don't send binary data in list
      imageUrl: `${baseUrl}/api/icons/${icon.id}/image`,
    }));
  }

  async findOne(id: string) {
    const icon = await this.prisma.icon.findUnique({
      where: { id },
    });

    if (!icon) {
      throw new NotFoundException(`Icon with ID ${id} not found`);
    }

    const baseUrl = process.env.API_URL || 'http://localhost:4000';

    return {
      ...icon,
      imageData: undefined,
      imageUrl: `${baseUrl}/api/icons/${id}/image`,
    };
  }

  async getImage(id: string): Promise<{ data: Buffer; mimeType: string }> {
    const icon = await this.prisma.icon.findUnique({
      where: { id },
      select: { imageData: true, imageMimeType: true },
    });

    if (!icon) {
      throw new NotFoundException(`Icon with ID ${id} not found`);
    }

    return {
      data: icon.imageData,
      mimeType: icon.imageMimeType,
    };
  }

  async update(id: string, updateIconDto: UpdateIconDto) {
    const icon = await this.prisma.icon.findUnique({ where: { id } });

    if (!icon) {
      throw new NotFoundException(`Icon with ID ${id} not found`);
    }

    const { imageData, ...rest } = updateIconDto;
    const data: any = { ...rest };

    if (imageData) {
      data.imageData = Buffer.from(imageData, 'base64');
    }

    return this.prisma.icon.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const icon = await this.prisma.icon.findUnique({ where: { id } });

    if (!icon) {
      throw new NotFoundException(`Icon with ID ${id} not found`);
    }

    return this.prisma.icon.delete({ where: { id } });
  }
}
