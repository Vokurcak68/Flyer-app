import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FlyersModule } from './flyers/flyers.module';
import { VerificationModule } from './verification/verification.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { ProductsModule } from './products/products.module';
import { BrandsModule } from './brands/brands.module';
import { PromoImagesModule } from './promo-images/promo-images.module';
import { IconsModule } from './icons/icons.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { UploadService } from './common/upload.service';
import { UploadController } from './common/upload.controller';
import { MssqlService } from './common/mssql.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    BrandsModule,
    PromoImagesModule,
    IconsModule,
    CategoriesModule,
    FlyersModule,
    VerificationModule,
    ApprovalsModule,
  ],
  controllers: [UploadController],
  providers: [UploadService, MssqlService],
})
export class AppModule {}
