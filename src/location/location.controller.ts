import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { LocationService } from './locationService';
import { createLocationDto } from './dto/createLcationDto';
import { deleteLocationDto } from './dto/deleteLocationDto';
import { ApiResponse } from '@nestjs/swagger';

@Controller('location')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Post()
  async createLocation(@Body() body: createLocationDto) {
    return this.locationService.createLocation(body);
  }

  @Delete()
  async deleteLocationDto(@Body() body: deleteLocationDto) {
    return this.locationService.deleteLocation(body);
  }

  @Get('get-all')
  @ApiResponse({
    status: 200,
    type: [createLocationDto],
  })
  async getAllLocation() {
    return this.locationService.getAllLocation();
  }

  @Get('get-location-detail')
  getLocationDetail(@Query() query: { locationKeyword: string }) {
    return this.locationService.getLocationDetail(query.locationKeyword);
  }
}
