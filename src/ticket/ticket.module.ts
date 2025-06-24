import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity';
import { TicketService } from './ticket.service';
import { LocationDetailModule } from 'src/locationDetail/locationDetail.module';
import { TripModule } from 'src/trip/trip.module';
import { SeatModule } from 'src/seat/seat.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { ticketController } from './ticket.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    LocationDetailModule,
    TripModule,
    SeatModule,
    VehicleModule,
  ],
  controllers: [ticketController],
  providers: [TicketService],
})
export class TicketModule {}
