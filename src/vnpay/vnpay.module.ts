import { Module } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { VnpayController } from './vnpay.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentIntent } from '@/paymentIntent/paymentIntent.entity';
import { Ticket } from '@/ticket/ticket.entity';
import { TicketModule } from '@/ticket/ticket.module';
import { User } from '@/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentIntent, Ticket, User]),
    TicketModule,
  ],
  providers: [VnpayService],
  controllers: [VnpayController],
  exports: [VnpayService],
})
export class VnpayModule {}
