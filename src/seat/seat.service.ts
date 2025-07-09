import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Seat } from './seat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { validate as isUUD } from 'uuid';
import { isUUID } from 'class-validator';
import { CreateSeatDTO } from './dto/createSeatDTO';
import { TripService } from 'src/trip/trip.service';
import { VehicleService } from 'src/vehicle/vehicle.service';

@Injectable()
export class SeatService {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    private readonly tripService: TripService,
    private readonly vehicleService: VehicleService,
  ) {}

  async findSeatByIdOrSeatCode(keyword: string) {
    const isId = isUUID(keyword);
    const seat = await this.seatRepository.findOne({
      where: isId ? { seatId: keyword } : { seatCode: keyword },
      relations: ['trip'],
    });

    return seat;
  }

  // kiểm tra ghế này đã đặt trong trip này chưa
  async checkSeatExistsOnTrip(seatCode: string, tripId: string) {
    const seat = await this.seatRepository.findOne({
      where: {
        seatCode,
        trip: { tripId },
      },
    });

    if (seat) {
      return true; // Ghế đã tồn tại trong chuyến đi
    }
    return false;
  }

  async createSeat(data: CreateSeatDTO) {
    const { seatCode, tripId } = data;

    // Kiểm tra tripId có tồn tại không
    if (!isUUID(tripId)) {
      throw new NotFoundException('Trip không tồn tại trong hệ thống');
    }
    const trip = await this.tripService.findTripByID(tripId);
    if (!trip) {
      throw new NotFoundException('Trip không tồn tại trong hệ thống');
    }

    // Lấy vehicle của trip xem nó là BUS hay TRAIN/PLANE
    const vehicle = await this.vehicleService.findVehicleByIdOrCodeNumber(
      trip.vehicle.vehicleId,
    );
    if (!vehicle) {
      throw new NotFoundException('Phương tiện không tồn tại trong hệ thống');
    }

    // kiểm tra ghế có tồn tại trong cùng 1 chuyến ko
    const existsSeat = await this.seatRepository.findOne({
      where: {
        seatCode,
        trip: { tripId },
      },
    });
    if (existsSeat) {
      throw new ConflictException(
        `Ghế ${seatCode} đã tồn tại trong chuyến đi ${tripId}`,
      );
    }

    // Taoj seat
    const newSeat = this.seatRepository.create({
      seatCode,
      trip,
    });
    await this.seatRepository.save(newSeat);
    return newSeat;
  }

  // Lấy danh sách ghế đã đặt trong chuyến đi
  async getBookedSeatsByTripId(tripId: string): Promise<Seat[]> {
    const bookedSeats = await this.seatRepository.find({
      where: {
        trip: { tripId },
        isBooked: true,
      },
    });

    return bookedSeats;
  }
}
