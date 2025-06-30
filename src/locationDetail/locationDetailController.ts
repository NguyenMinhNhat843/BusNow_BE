import { Controller, Get, Param } from '@nestjs/common';
import { LocationDetailService } from './locationDetailService';

@Controller('location-detail')
export class LocationDetailController {
  constructor(private LocationDetailService: LocationDetailService) {}
}
