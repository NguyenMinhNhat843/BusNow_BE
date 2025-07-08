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

  findVehicleByIdOrCodeNumber(keyword: string) {
    const vehicle = this.vehicleRepository.findOne({
      where: isUUID(keyword) ? { vehicleId: keyword } : { code: keyword },
    });
    return vehicle;
  }
}
