import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StopPointService } from './stopPoint.service';
import { SearchStopPointDto } from './dto/SearchStopPoint';
import { CreateStopPointDto } from './dto/createStopPointDTO';

@Controller('stop-point')
export class StopPointController {
  constructor(private stopPointService: StopPointService) {}

  @Get()
  getStopPoints(@Query() query: SearchStopPointDto) {
    return this.stopPointService.searchStopPoint(query);
  }

  @Post()
  create(@Body() dto: CreateStopPointDto) {
    return this.stopPointService.createStopPoint(dto);
  }

  @Get('/by-route/:routeId')
  async getStopPointsByRoute(@Param('routeId') routeId: string) {
    const data = await this.stopPointService.findStopPointsByRoute(routeId);
    return {
      status: 'success',
      data,
    };
  }
}
