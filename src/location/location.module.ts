import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './location.entity';
import { LocationService } from './locationService';
import { LocationController } from './location.controller';
import { StopPoint } from '@/stopPoint/stopPoint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, StopPoint])],
  providers: [LocationService],
  controllers: [LocationController],
  exports: [TypeOrmModule, LocationService],
})
export class LocationModule {}
