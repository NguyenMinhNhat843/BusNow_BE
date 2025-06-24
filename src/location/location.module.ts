import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './location.entity';
import { LocationService } from './locationService';

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  providers: [LocationService],
  exports: [TypeOrmModule, LocationService],
})
export class LocationModule {}
