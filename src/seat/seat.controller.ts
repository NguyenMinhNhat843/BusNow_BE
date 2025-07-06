import { Body, Controller, Get, Param, Query } from '@nestjs/common';
import { SeatService } from './seat.service';

@Controller('seat')
export class SeatController {
  constructor(private seatService: SeatService) {}

  @Get('get-seat-is-booked-by-trip-id')
  async getSeatIsBookedByTripId(@Query() query: { tripId: string }) {
    const response = await this.seatService.getBookedSeatsByTripId(
      query.tripId,
    );
    return {
      status: 'success',
      data: response,
    };
  }
}
