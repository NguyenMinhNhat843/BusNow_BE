import { Injectable } from '@nestjs/common';
import { TripService } from 'src/trip/trip.service';
import { CleanTripDTO } from '../dto/cleanTrip.dto';

@Injectable()
export class TripCleanService {
  constructor(private tripService: TripService) {}

  async cleanTrip(data: CleanTripDTO) {
    const { vehicleId, date } = data;

    // Tìm trip by vehicleid
    const trips = await this.tripService.findTripByVehicleId(vehicleId, 1, 100);

    console.log(trips);
  }
}
