import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './trip.entity';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { LocationModule } from 'src/location/location.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';

@Module({
  imports: [TypeOrmModule.forFeature([Trip]), LocationModule, VehicleModule],
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService, TypeOrmModule],
})
export class TripModule {}
