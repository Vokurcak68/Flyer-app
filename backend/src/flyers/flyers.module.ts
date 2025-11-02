import { Module, forwardRef } from '@nestjs/common';
import { FlyersService } from './flyers.service';
import { FlyersController } from './flyers.controller';
import { PdfService } from './pdf.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationModule } from '../verification/verification.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { MssqlService } from '../common/mssql.service';

@Module({
  imports: [PrismaModule, VerificationModule, forwardRef(() => ApprovalsModule)],
  controllers: [FlyersController],
  providers: [FlyersService, PdfService, MssqlService],
  exports: [FlyersService],
})
export class FlyersModule {}
