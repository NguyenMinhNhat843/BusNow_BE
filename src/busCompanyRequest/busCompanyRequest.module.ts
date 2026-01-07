import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusCompanyRequestEntity } from './busCompanyRequest.entity';
import { BusCompanyRequestService } from './busCOmpanyRequest.service';
import { BusCompanyRequestController } from './busCompanyRequest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BusCompanyRequestEntity])],
  controllers: [BusCompanyRequestController],
  providers: [BusCompanyRequestService],
  exports: [BusCompanyRequestService],
})
export class BusCompanyRequestModule {}
