import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationDetail } from './locationDetail.entity';
import { LocationModule } from 'src/location/location.module';
import { LocationDetailService } from './locationDetailService';

@Module({
  imports: [TypeOrmModule.forFeature([LocationDetail]), LocationModule],
  providers: [LocationDetailService],
  exports: [TypeOrmModule, LocationDetailService],
})
export class LocationDetailModule {}
