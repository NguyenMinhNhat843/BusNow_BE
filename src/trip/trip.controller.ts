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

  @Post('gen-trips')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.PROVIDER]))
  async genTrips(@Query() data: GenTripDTO) {
    const response = await this.tripService.genTrip(data);
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
