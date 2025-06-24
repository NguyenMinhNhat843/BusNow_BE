import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTIcketDTO } from './dto/createTicketDTO';
import { LocationDetail } from 'src/locationDetail/locationDetail.entity';
import { Trip } from 'src/trip/trip.entity';
import { Seat } from 'src/seat/seat.entity';
import { User } from 'src/user/user.entity';
import { Vehicle } from 'src/vehicle/vehicle.entity';
import { LocationDetailService } from 'src/locationDetail/locationDetailService';
import { TripService } from 'src/trip/trip.service';
import { SeatService } from 'src/seat/seat.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,

    private locationDetailService: LocationDetailService,

    private readonly tripService: TripService,
    private readonly seatService: SeatService,

    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async createTicket(ticketData: CreateTIcketDTO, user: User) {
    const { departLocationId, arriveLocationId, tripId, seatCode, typeSeat } =
      ticketData;

    // Check tồn tại depart locationDetail
    const departLocation =
      await this.locationDetailService.findLocationDetailByIdOrName(
        departLocationId,
      );
    if (!departLocation)
      throw new BadRequestException(
        'Địa điểm khởi hành không tồn tại trong hệ thống!!',
      );

    // Check tồn tại arive locationDetail
    const arriveLocation =
      await this.locationDetailService.findLocationDetailByIdOrName(
        arriveLocationId,
      );
    if (!arriveLocation) {
      throw new BadRequestException(
        'Địa điểm đến không tồn tại trong hệ thống!!',
      );
    }

    // Check tồn tại trip
    const trip = await this.tripService.findTripByID(tripId);
    if (!trip) {
      throw new BadRequestException('Chuyến đi không tồn tại trong hệ thống!!');
    }

    // Tạo seat nếu chưa có
    const newSeat = await this.seatService.createSeat({
      seatCode,
      tripId: trip.tripId,
      typeSeat: typeSeat,
    });

    // Tạo ticket
    console.log('User: ', user);
    const newTicket = this.ticketRepository.create({
      ticketTime: new Date(),
      departLocation,
      arrivalLocation: arriveLocation,
      trip,
      seat: newSeat,
      status: 'UNPAID', // Mặc định trạng thái là UNPAID
      user,
    });
    console.log('New Ticket Created: ', newTicket);
    await this.ticketRepository.save(newTicket);

    return newTicket;
  }
}
