import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  getAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find();
  }
}
