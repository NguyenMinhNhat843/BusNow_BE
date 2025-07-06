import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seat } from './seat.entity';
import { TripModule } from 'src/trip/trip.module';
import { SeatService } from './seat.service';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { SeatController } from './seat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Seat]), TripModule, VehicleModule],
  providers: [SeatService],
  controllers: [SeatController],
  exports: [SeatService],
})
export class SeatModule {}
