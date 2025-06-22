import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationDetail } from './locationDetail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LocationDetail])],
})
export class LocationDetailModule {}
