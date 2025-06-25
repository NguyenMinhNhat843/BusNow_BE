import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
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
    private dataSource: DataSource,
  ) {}

  async createTicket(ticketData: CreateTIcketDTO, user: User) {
    const querryRunner = this.dataSource.createQueryRunner();
    await querryRunner.connect();
    await querryRunner.startTransaction();

    try {
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
        throw new BadRequestException(
          'Chuyến đi không tồn tại trong hệ thống!!',
        );
      }

      // Check trùng ghế trong trip
      const existsSeatOnTrip = await this.seatService.checkSeatExistsOnTrip(
        seatCode,
        tripId,
      );
      if (existsSeatOnTrip) {
        throw new BadRequestException(
          `Ghế ${seatCode} đã được đặt trong chuyến đi ${tripId}!!`,
        );
      }

      // Tạo seat
      const newSeat = querryRunner.manager.create(Seat, {
        seatCode,
        trip,
        typeSeat: trip.vehicle.type === 'BUS' ? null : typeSeat,
        isBooked: true,
      });
      await querryRunner.manager.save(newSeat);

      // Tạo ticket
      const newTicket = querryRunner.manager.create(Ticket, {
        ticketTime: new Date(),
        departLocation,
        arrivalLocation: arriveLocation,
        trip,
        seat: newSeat,
        seatCode,
        status: 'UNPAID',
        user,
      });
      await querryRunner.manager.save(newTicket);

      await querryRunner.commitTransaction();
      return newTicket;
    } catch (error) {
      await querryRunner.rollbackTransaction();
      throw new BadRequestException(error.message || 'Lỗi khi tạo vé');
    } finally {
      await querryRunner.release();
    }
  }
}
