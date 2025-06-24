import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Trip } from './trip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { createTripDTO } from './dto/createTripDTO';
import { Location } from 'src/location/location.entity';
import { Vehicle } from 'src/vehicle/vehicle.entity';
import { Seat } from 'src/seat/seat.entity';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,

    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async findTripByID(id: string) {
    const result = await this.tripRepository.findOne({
      where: { tripId: id },
      relations: ['from', 'to', 'vehicle'],
    });

    return result;
  }

  async createTrip(data: createTripDTO) {
    // Kiểm tra location from và to cón tồn tại không
    const from = await this.locationRepository.findOneBy({
      locationId: data.fromLocationId,
    });
    if (!from) {
      throw new BadRequestException('Địa điểm không tồn tại trong hệ thống!!');
    }

    const to = await this.locationRepository.findOneBy({
      locationId: data.toLocationId,
    });
    if (!to)
      throw new BadRequestException('Địa điểm không tồn tại trong hệ thống!!');

    // Kiểm tra vehicle của trip này có tồn tại không
    const vehicle = await this.vehicleRepository.findOneBy({
      vehicleId: data.vehicleId,
    });
    if (!vehicle) {
      throw new BadRequestException(
        'Phương tiện không tồn tại trong hệ thống!!',
      );
    }

    // Kiểm tra arivelTime > departTime
    if (new Date(data.arriveTime) <= new Date(data.departTime)) {
      throw new BadRequestException(
        'Thời gian đến phải lớn hơn thời gian khởi hành!!',
      );
    }

    const tripData = {
      price: data.price,
      departTime: data.departTime,
      arriveTime: data.arriveTime,
      availabelSeat: vehicle.totalSeat, // Số ghế có sẵn bằng tổng số ghế của phương tiện
      from,
      to,
      vehicle,
    };
    const trip = this.tripRepository.create(tripData);
    await this.tripRepository.save(trip);

    return trip;
  }
}
