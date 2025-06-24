import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seat } from './seat.entity';
import { TripModule } from 'src/trip/trip.module';
import { SeatService } from './seat.service';
import { VehicleModule } from 'src/vehicle/vehicle.module';

@Module({
  imports: [TypeOrmModule.forFeature([Seat]), TripModule, VehicleModule],
  providers: [SeatService],
  exports: [SeatService],
})
export class SeatModule {}
