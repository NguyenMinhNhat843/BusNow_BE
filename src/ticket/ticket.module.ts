import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity';
import { TicketService } from './ticket.service';
import { TripModule } from 'src/trip/trip.module';
import { SeatModule } from 'src/seat/seat.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { ticketController } from './ticket.controller';
import { StopPointModule } from 'src/stopPoint/stopPoint.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    StopPointModule,
    TripModule,
    SeatModule,
    VehicleModule,
  ],
  controllers: [ticketController],
  providers: [TicketService],
})
export class TicketModule {}
