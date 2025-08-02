import { TypeOrmModule } from '@nestjs/typeorm';
import { CancellationRequest } from './cancellationRequest.entity';
import { Module } from '@nestjs/common';
import { TicketModule } from 'src/ticket/ticket.module';
import { CancellationRequestService } from './cancellationRequest.service';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([CancellationRequest])],
  providers: [CancellationRequestService],
  controllers: [],
  exports: [CancellationRequestService],
})
export class CancelationRequesModule {}
