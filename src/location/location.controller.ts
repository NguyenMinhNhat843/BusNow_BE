import { Controller, Get, Param, Query } from '@nestjs/common';
import { LocationService } from './locationService';

@Controller('location')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Get('get-all')
  async getAllLocation() {
    return this.locationService.getAllLocation();
  }

  @Get('get-location-detail')
  getLocationDetail(@Query() query: { locationKeyword: string }) {
    return this.locationService.getLocationDetail(query.locationKeyword);
  }
}
