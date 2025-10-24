import { Module, forwardRef } from '@nestjs/common';
import { FlyersService } from './flyers.service';
import { FlyersController } from './flyers.controller';
import { PdfService } from './pdf.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationModule } from '../verification/verification.module';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [PrismaModule, VerificationModule, forwardRef(() => ApprovalsModule)],
  controllers: [FlyersController],
  providers: [FlyersService, PdfService],
  exports: [FlyersService],
})
export class FlyersModule {}
