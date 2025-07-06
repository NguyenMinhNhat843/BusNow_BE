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
import { PaymentStatus } from 'src/common/enum/PaymentStatus';
import { FilterTicketDTO } from './dto/filterTicketDTO';
import { SortTicketEnum } from 'src/common/enum/sortTicketEnum';

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

      // validate seatCode đúng theo mẫu A01
      const regex = /^A\d{2}$/;
      if (!regex.test(seatCode)) {
        throw new BadRequestException(
          'Mã ghế không hợp lệ. Vui lòng sử dụng định dạng Axx (ví dụ: A01, A02, ...)',
        );
      }

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

      // validate seatCode phải >= 01 và <= totalSeat của vehicle
      const numberSeatCode = parseInt(seatCode.slice(1), 10);
      const totalSeat = trip.vehicle.totalSeat;
      if (numberSeatCode < 1 || numberSeatCode > totalSeat) {
        throw new BadRequestException(
          `Mã ghế ${seatCode} không hợp lệ. Vui lòng sử dụng mã ghế từ A01 đến A${totalSeat.toString().padStart(2, '0')}`,
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
        status: ticketData.statusPayment
          ? ticketData.statusPayment
          : PaymentStatus.PENDING,
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
        departLocation: departLocationDetail,
        arrivalLocation: arriveLocatioDetailn,
        trip,
        seat: newSeat,
        seatCode,
        status: 'UNPAID',
        user,
        payment,
      });
      await querryRunner.manager.save(newTicket);

      // Cập nhật -1 ghế đã đặt trong trip
      trip.availabelSeat -= 1;
      await querryRunner.manager.save(trip);

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

  async getListTicketByUserId(userId: string) {
    const tickets = await this.ticketRepository.find({
      where: {
        user: { userId },
      },
      relations: [
        'trip',
        'seat',
        'departLocation',
        'arrivalLocation',
        'payment',
      ],
    });

    return tickets;
  }

  async filterTicketPagination(data: FilterTicketDTO) {
    const { numberPerPage, page, userId, time, ticketStatus, sortBy } = data;

    // Kiểm tra

    // query
    const queryTicket = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.departLocation', 'departLocation')
      .leftJoinAndSelect('ticket.arrivalLocation', 'arrivelLocation')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.trip', 'trip')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('ticket.payment', 'payment');

    // Có userId
    if (userId) {
      queryTicket.andWhere('user.userId = :userId', { userId });
    }

    // có time
    if (time) {
      const { startTime, endTime } = time;
      endTime?.setHours(23, 59, 59, 999);

      queryTicket.andWhere(
        'ticket.ticketTime BETWEEN :startTime AND :endTime',
        { startTime, endTime },
      );
    }

    // Có ticketStatus
    if (ticketStatus) {
      queryTicket.andWhere('ticket.status = :status', { status: ticketStatus });
    }

    // sortBy
    switch (sortBy) {
      case SortTicketEnum.TIME_ASC:
        queryTicket.orderBy('ticket.ticketTime', 'ASC');
        break;
      case SortTicketEnum.TIME_DESC:
        queryTicket.orderBy('ticket.ticketTime', 'DESC');
        break;
    }

    // phân trang
    const [result, total] = await queryTicket
      .skip((page - 1) * numberPerPage)
      .take(numberPerPage)
      .getManyAndCount();

    return {
      status: 'success',
      pagination: {
        page,
        numberPerPage,
        total,
        totalPage: Math.ceil(total / numberPerPage),
      },
      tickets: result,
    };
  }
}
