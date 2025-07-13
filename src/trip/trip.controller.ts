import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TripService } from './trip.service';
import { createTripDTO } from './dto/createTripDTO';
import { SearchTripDTO } from './dto/searchTripDTO';
import { DateTime } from 'luxon';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/user/guards/roles.guard';
import { RoleEnum } from 'src/common/enum/RoleEnum';
import { GenTripDTO } from './dto/genTripDTO';
import { DeleteTripDTO } from './dto/deleteTripDTO';

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
      const departTime = DateTime.fromJSDate(trip.departDate, { zone: 'utc' });
      const arriveTime = departTime.plus({
        hours: trip.vehicle?.route?.duration || 0,
      });
      return {
        tripId: trip.tripId,
        routeId: trip.vehicle.route.routeId,
        price: trip.price,
        availableSeat: trip.availabelSeat,
        totalSeat: trip.vehicle?.totalSeat,
        codeNumber: trip.vehicle.code,
        vehicleName: trip.vehicle.provider.lastName,
        busType: trip.vehicle.busType,
        fromId: trip.vehicle.route.origin.locationId,
        fromname: trip.vehicle.route.origin.name,
        departTime: trip.departDate,
        toId: trip.vehicle.route.destination.locationId,
        toName: trip.vehicle.route.destination.name,
        arriveTime: arriveTime,
        type: trip.type,
      };
    });

    return {
      ...response,
      trips: formattedTrips,
    };
  }

  @Get('vehicle')
  async getTripsByVehicle(
    @Query('vehicleId') vehicleId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.tripService.findTripByVehicleId(vehicleId, +page, +limit);
  }

  @Post('gen-trips')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.PROVIDER]))
  async genTrips(@Body() data: GenTripDTO) {
    const response = await this.tripService.genTrip(data); //asdsad
    return response;
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.PROVIDER]))
  async deleteTrips(@Body() deleteTripDto: DeleteTripDTO) {
    const result = await this.tripService.deleteTrip(deleteTripDto);
    return result;
  }
}
