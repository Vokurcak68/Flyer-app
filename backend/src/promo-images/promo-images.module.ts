import { Module } from '@nestjs/common';
import { PromoImagesService } from './promo-images.service';
import { PromoImagesController } from './promo-images.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PromoImagesController],
  providers: [PromoImagesService],
  exports: [PromoImagesService],
})
export class PromoImagesModule {}
