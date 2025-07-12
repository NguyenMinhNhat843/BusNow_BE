import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTIcketDTO } from './dto/createTicketDTO';
import { Seat } from 'src/seat/seat.entity';
import { User } from 'src/user/user.entity';
import { StopPointService } from 'src/stopPoint/stopPoint.service';
import { TripService } from 'src/trip/trip.service';
import { SeatService } from 'src/seat/seat.service';
import { Payment } from 'src/payment/payment.entity';
import { TicketStatus } from 'src/common/enum/TicketStatus';
import { PaymentStatus } from 'src/common/enum/PaymentStatus';
import { FilterTicketDTO } from './dto/filterTicketDTO';
import { SortTicketEnum } from 'src/common/enum/sortTicketEnum';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private stopPointService: StopPointService,
    private readonly tripService: TripService,
    private readonly seatService: SeatService,
    private dataSource: DataSource,
  ) {}

  async createTicket(ticketData: CreateTIcketDTO, user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { tripId, seatCode, methodPayment, statusPayment } = ticketData;

      // Kiểm tra trip tồn tại
      const trip = await this.tripService.findTripByID(tripId);
      if (!trip) {
        throw new BadRequestException(
          'Chuyến đi không tồn tại trong hệ thống!',
        );
      }

      const totalSeat = trip.vehicle.totalSeat;

      // Kiểm tra ghế hợp lệ & đã được đặt chưa
      for (const seat of seatCode) {
        if (seat < 1 || seat > totalSeat) {
          throw new BadRequestException(
            `Mã ghế ${seat} không hợp lệ. Chỉ từ 1 đến ${totalSeat}`,
          );
        }

        const existsSeat = await this.seatService.checkSeatExistsOnTrip(
          seat,
          tripId,
        );
        if (existsSeat) {
          throw new BadRequestException(
            `Ghế ${seat} đã được đặt trong chuyến đi này!`,
          );
        }
      }

      const createdTickets: any[] = [];
      for (const seat of seatCode) {
        // Tạo payment
        const payment = queryRunner.manager.create(Payment, {
          amount: trip.price * seatCode.length,
          paymentTime: new Date(),
          method: methodPayment,
          status: statusPayment || PaymentStatus.PENDING,
          user,
        });
        await queryRunner.manager.save(payment);

        // Tạo seat
        const newSeat = queryRunner.manager.create(Seat, {
          seatCode: seat,
          trip,
          isBooked: true,
        });
        await queryRunner.manager.save(newSeat);

        // Tạo ticket
        const newTicket = queryRunner.manager.create(Ticket, {
          trip,
          seat: newSeat,
          seatCode: seat,
          status: 'UNPAID',
          user,
          payment,
          ticketTime: new Date(),
        });
        await queryRunner.manager.save(newTicket);

        createdTickets.push(newTicket);
      }

      // Cập nhật số lượng ghế trống
      trip.availabelSeat -= seatCode.length;
      await queryRunner.manager.save(trip);

      await queryRunner.commitTransaction();
      return {
        message: 'Tạo vé thành công!',
        tickets: createdTickets,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message || 'Lỗi khi tạo vé');
    } finally {
      await queryRunner.release();
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
    const { numberPerPage, page, email, time, ticketStatus, sortBy } = data;

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
    if (email) {
      queryTicket.andWhere('user.email = :email', { email });
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
