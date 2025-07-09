import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TripService } from './trip.service';
import { createTripDTO } from './dto/createTripDTO';
import { SearchTripDTO } from './dto/searchTripDTO';
import { DateTime } from 'luxon';

@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post('create')
  async createTrip(@Body() data: createTripDTO) {
    return await this.tripService.createTrip(data);
  }

  @Get('search-trip')
  async searchTrip(@Query() query: SearchTripDTO) {
    const response = await this.tripService.searchTrip(query);
    const formattedTrips = response.trips.map((trip) => {
      return {
        tripId: trip.tripId,
        price: trip.price,
        availableSeat: trip.availabelSeat,
        totalSeat: trip.vehicle?.totalSeat,
        // codeNumber: trip.codeNumber,
        busType: trip.vehicle.busType,
        nameProvider: trip.vehicle.provider.lastName,
        avatarProvider: trip.vehicle.provider.avatar,
      };
    });

    return {
      ...response,
      trips: formattedTrips,
    };
  }
}
