import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StopPoint } from './stopPoint.entity';
import { LocationModule } from 'src/location/location.module';
import { StopPointService } from './stopPoint.service';

@Module({
  imports: [TypeOrmModule.forFeature([StopPoint]), LocationModule],
  providers: [StopPointService],
  exports: [TypeOrmModule, StopPointService],
})
export class StopPointModule {}
