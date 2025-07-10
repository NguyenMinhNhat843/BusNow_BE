import { Controller, Get, Param } from '@nestjs/common';
import { StopPointService } from './stopPoint.service';

@Controller('location-detail')
export class StopPointController {
  constructor(private LocationDetailService: StopPointService) {}
}
