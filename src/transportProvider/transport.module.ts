import { Module } from '@nestjs/common';
import { TransportProviderController } from './transportProviderController';
import { TransportProviderService } from './transportProviderService';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportProvider } from './transportProvider.entity';
import { Vehicle } from 'src/vehicle/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransportProvider])],
  controllers: [TransportProviderController],
  providers: [TransportProviderService],
})
export class TransportProviderModule {}
