import { Controller, Get } from '@nestjs/common';
import { LocationService } from './locationService';

@Controller('location')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Get('get-all')
  async getAllLocation() {
    return this.locationService.getAllLocation();
  }
}
