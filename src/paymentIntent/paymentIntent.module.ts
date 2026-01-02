import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentIntent } from './paymentIntent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentIntent])],
  exports: [TypeOrmModule],
})
export class PaymentIntentModule {}
