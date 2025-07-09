import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './vehicle.entity';
import { UserModule } from 'src/user/user.module';
import { RouteModule } from 'src/route/route.module';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle]), UserModule, RouteModule],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService, TypeOrmModule],
})
export class VehicleModule {}
