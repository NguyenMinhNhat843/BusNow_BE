import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusCompanyRequestEntity } from './busCompanyRequest.entity';
import { BusCompanyRequestController } from './busCompanyRequest.controller';
import { BusCompanyRequestService } from './busCompanyRequest.service';
import { S3Module } from '@/s3/s3.module';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusCompanyRequestEntity]),
    S3Module,
    MailModule,
  ],
  controllers: [BusCompanyRequestController],
  providers: [BusCompanyRequestService],
  exports: [BusCompanyRequestService],
})
export class BusCompanyRequestModule {}
