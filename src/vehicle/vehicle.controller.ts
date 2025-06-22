import { Controller, Get } from '@nestjs/common';
import { VehicleService } from './vehicle.service';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  async getAll() {
    return this.vehicleService.getAll();
  }
}
