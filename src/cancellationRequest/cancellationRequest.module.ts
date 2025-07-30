import { TypeOrmModule } from '@nestjs/typeorm';
import { CancellationRequest } from './cancellationRequest.entity';
import { Module } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([CancellationRequest])],
  providers: [],
  controllers: [],
  exports: [],
})
export class CancelationRequesModule {}
