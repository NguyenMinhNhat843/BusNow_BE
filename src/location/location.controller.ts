import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LocationService } from './locationService';
import { createLocationDto } from './dto/createLcationDto';

@Controller('location')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Post()
  async createLocation(@Body() body: createLocationDto) {
    return this.locationService.createLocation(body);
  }

  @Get('get-all')
  async getAllLocation() {
    return this.locationService.getAllLocation();
  }

  @Get('get-location-detail')
  getLocationDetail(@Query() query: { locationKeyword: string }) {
    return this.locationService.getLocationDetail(query.locationKeyword);
  }
}
