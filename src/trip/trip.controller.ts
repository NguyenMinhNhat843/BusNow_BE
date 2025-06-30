import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TripService } from './trip.service';
import { createTripDTO } from './dto/createTripDTO';
import { SearchTripDTO } from './dto/searchTripDTO';

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
        departTime: trip.departTime,
        arriveTime: trip.arriveTime,
        availableSeat: trip.availabelSeat,
        totalSeat: trip.vehicle?.totalSeat,
        fromLocationName: trip.fromLocationName,
        toLocationName: trip.toLocationName,
        codeNumber: trip.codeNumber,
        typeVehicle: trip.vehicle?.type,
        subTypeVehicle: trip.vehicle?.subType,
        nameProvider: trip.vehicle?.transportProvider?.name,
        avatarProvider: trip.vehicle?.transportProvider?.logo,
      };
    });
    return {
      status: 'success',
      trips: formattedTrips,
    };
  }
}
