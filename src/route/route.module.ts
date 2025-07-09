import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from './route.entity';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';
import { UserModule } from 'src/user/user.module';
import { LocationModule } from 'src/location/location.module';

@Module({
  imports: [TypeOrmModule.forFeature([Route]), UserModule, LocationModule],
  controllers: [RouteController],
  providers: [RouteService],
  exports: [TypeOrmModule, RouteService],
})
export class RouteModule {} //asdasda
