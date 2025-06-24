import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { validate as isUUID } from 'uuid';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  findVehicleById(id: string) {
    const isId = isUUID(id);
    if (!isId) {
      throw new BadRequestException('Id không hợp lệ');
    }

    const vehicle = this.vehicleRepository.findOne({
      where: { vehicleId: id },
    });
    return vehicle;
  }

  getAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find();
  }
}
