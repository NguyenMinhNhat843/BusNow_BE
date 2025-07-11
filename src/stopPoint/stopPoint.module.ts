import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StopPoint } from './stopPoint.entity';
import { LocationModule } from 'src/location/location.module';
import { StopPointService } from './stopPoint.service';
import { StopPointController } from './stopPoint.controller';
import { RouteModule } from 'src/route/route.module';

@Module({
  imports: [TypeOrmModule.forFeature([StopPoint]), LocationModule],
  providers: [StopPointService],
  controllers: [StopPointController],
  exports: [TypeOrmModule, StopPointService],
})
export class StopPointModule {}
