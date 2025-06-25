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
import { Payment } from 'src/payment/payment.entity';
import { PaymentMethod } from 'src/common/enum/PaymentMethod';
import { TicketStatus } from 'src/common/enum/TicketStatus';

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
      const {
        departLocationDetailId,
        arriveLocationDetailId,
        tripId,
        seatCode,
        typeSeat,
        methodPayment,
      } = ticketData;

      // Check tồn tại depart locationDetail
      const departLocationDetail =
        await this.locationDetailService.findLocationDetailByIdOrName(
          departLocationDetailId,
        );
      if (!departLocationDetail)
        throw new BadRequestException(
          'Địa điểm khởi hành không tồn tại trong hệ thống!!',
        );

      // Check tồn tại arive locationDetail
      const arriveLocatioDetailn =
        await this.locationDetailService.findLocationDetailByIdOrName(
          arriveLocationDetailId,
        );
      if (!arriveLocatioDetailn) {
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

      // tạo payment
      const payment = querryRunner.manager.create(Payment, {
        amount: trip.price,
        paymentTime: new Date(),
        method: methodPayment,
        status: 'PENDING',
        user,
      });
      await querryRunner.manager.save(payment);

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
        departLocationDetail,
        arrivalLocation: arriveLocatioDetailn,
        trip,
        seat: newSeat,
        seatCode,
        status: 'UNPAID',
        user,
        payment,
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

  async cancleTicket(ticketId: string, userId: string) {
    const ticket = await this.ticketRepository.findOne({
      where: {
        ticketId,
        user: {
          userId,
        },
      },
    });
    if (!ticket) {
      throw new BadRequestException(
        'Vé không tồn tại hoặc không thuộc về người dùng này',
      );
    }
    ticket.status = TicketStatus.CANCELLED;
    await this.ticketRepository.save(ticket);
    return {
      status: 'success',
      message: 'Vé đã được hủy thành công',
      ticket,
    };
  }
}
