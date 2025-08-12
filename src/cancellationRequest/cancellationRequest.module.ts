import { TypeOrmModule } from '@nestjs/typeorm';
import { CancellationRequest } from './cancellationRequest.entity';
import { forwardRef, Module } from '@nestjs/common';
import { TicketModule } from 'src/ticket/ticket.module';
import { CancellationRequestService } from './cancellationRequest.service';
import { UserModule } from 'src/user/user.module';
import { RefundRequestController } from './cancellationRequest.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CancellationRequest]),
    forwardRef(() => TicketModule),
    forwardRef(() => UserModule),
  ],
  providers: [CancellationRequestService],
  controllers: [RefundRequestController],
  exports: [CancellationRequestService],
})
export class CancelationRequesModule {}
