import { Module } from '@nestjs/common';
import { TripCleanService } from './service/tripClean.service';
import { TripModule } from 'src/trip/trip.module';

@Module({
  imports: [TripModule],
  providers: [TripCleanService],
})
export class ApplicationModule {}
