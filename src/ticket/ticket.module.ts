import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity';
import { TicketService } from './ticket.service';
import { TripModule } from 'src/trip/trip.module';
import { SeatModule } from 'src/seat/seat.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { ticketController } from './ticket.controller';
import { StopPointModule } from 'src/stopPoint/stopPoint.module';
import { UserModule } from 'src/user/user.module';
import { MailModule } from 'src/mail/mail.module';
import { CancellationRequest } from 'src/cancellationRequest/cancellationRequest.entity';
import { CancelationRequesModule } from 'src/cancellationRequest/cancellationRequest.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, CancellationRequest]),
    StopPointModule,
    TripModule,
    SeatModule,
    VehicleModule,
    UserModule,
    MailModule,
    CancelationRequesModule,
    RedisModule,
  ],
  controllers: [ticketController],
  providers: [TicketService],
  exports: [TicketService, TypeOrmModule],
})
export class TicketModule {}
