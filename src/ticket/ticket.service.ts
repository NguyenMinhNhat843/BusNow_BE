import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { SendTicketEmailDTO } from 'src/mail/dto/sendTicketEmail.dto';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';
import { BankingInfoDTO } from 'src/mail/dto/bankingInfo.dto';
import { CancellationRequestService } from 'src/cancellationRequest/cancellationRequest.service';
import { RedisService } from 'src/redis/redis.service';
import { UpdateTicketDTO } from './dto/updateTicketDTO';
import { searchTicketDTO } from './dto/searchTicketDTO';
import { CancleTicketDTO } from './dto/cancleTicketDTO';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { ConfirmCancleTicketDTO } from './dto/confirmCancleTicketDTO';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private stopPointService: StopPointService,
    private readonly tripService: TripService,
    private readonly seatService: SeatService,
    private dataSource: DataSource,
    private mailService: MailService,
    private cancelationRequestService: CancellationRequestService,
    private redisService: RedisService,
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
          amount: trip.price,
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

      // Guiwr mail
      for (const t of createdTickets) {
        const ticket = await this.findTicket(t.ticketId as string);
        if (!ticket) {
          throw new BadRequestException('Có lỗi j đó');
        }

        const emailData: SendTicketEmailDTO = {
          ticketId: ticket.ticketId,
          fullName: `${ticket.user.firstName} ${ticket.user.lastName}`,
          busName: ticket.trip.vehicle.provider.lastName || 'Nhà xe',
          busCode: ticket.trip.vehicle.code,
          departDate: ticket.trip.departDate.toISOString(),
          price: ticket.trip.price,
          seatCode: ticket.seat.seatCode,
          origin: ticket.trip.vehicle.route.origin.name,
          destination: ticket.trip.vehicle.route.destination.name,
        };
        await this.mailService.sendTicketEmail(user.email, emailData);
      }

      return {
        message: 'Tạo vé thành công!',
        tickets: createdTickets,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
      throw new BadRequestException(error.message || 'Lỗi khi tạo vé');
    } finally {
      await queryRunner.release();
    }
  }

  async updateTicket(payload: UpdateTicketDTO): Promise<Ticket> {
    const { ticketId, status } = payload;
    const ticket = await this.ticketRepository.findOne({
      where: { ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket không tồn tại');
    }
    if (status) ticket.status = status;

    await this.ticketRepository.save(ticket);

    return ticket;
  }

  async searchTicket(payload: searchTicketDTO) {
    const { limit = 10, page = 1, ticketId } = payload;

    const where: any = {};
    if (ticketId) where.ticketId = ticketId;

    const [data, total] = await this.ticketRepository.findAndCount({
      where,
      relations: {
        user: true,
        seat: true,
        trip: {
          vehicle: {
            route: {
              origin: true,
              destination: true,
            },
            provider: true,
          },
        },
        payment: true,
        cancellationRequest: true,
      },
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findTicket(ticketId: string) {
    const result = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.trip', 'trip')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('ticket.payment', 'payment')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.route', 'route')
      .leftJoinAndSelect('route.origin', 'origin')
      .leftJoinAndSelect('route.destination', 'destination')
      .leftJoinAndSelect('vehicle.provider', 'provider')
      .where('ticket.ticketId = :ticketId', { ticketId })
      .getOne();
    return result;
  }

  async cancleTicket(payload: CancleTicketDTO, userId: string) {
    const { ticketId, bankingInfo } = payload;
    const ticket = await this.findTicket(ticketId);
    if (!ticket) throw new NotFoundException('Ticket không tồn tại');

    if (ticket.status === String(TicketStatus.CANCELLED)) return;

    if (ticket.status !== String(TicketStatus.PAID)) {
      await this.ticketRepository.delete({ ticketId });
      return { message: 'Hủy vé thành công' };
    } else {
      if (!bankingInfo)
        throw new ConflictException('Thiếu thông tin tài khoản');
      if (userId !== ticket.user.userId)
        throw new BadRequestException(
          'UserId hủy vé không khớp với UserId đặt vé',
        );
      const order = {
        ticketId: ticketId,
        fullName: `${ticket.user.firstName} ${ticket.user.lastName}`,
        busName: ticket.trip.vehicle.provider.lastName || 'Nhà xe',
        busCode: ticket.trip.vehicle.code,
        departDate: ticket.trip.departDate.toISOString(),
        price: ticket.trip.price,
        seatCode: ticket.seat.seatCode,
        origin: ticket.trip.vehicle.route.origin.name,
        destination: ticket.trip.vehicle.route.destination.name,
      };
      await this.mailService.sendEmailCancleTicket(
        ticket.user.email,
        order,
        bankingInfo,
      );
      return {
        status: 'success',
        message: 'Đã gửi thông tin qua mail, vui lòng xác thực để hoàn tất!!',
        ticket,
      };
    }
  }

  async confirmCancleTicket(payload: ConfirmCancleTicketDTO) {
    const { cancleTicketRequest, otp } = payload;
    const { ticketId, bankingInfo } = cancleTicketRequest;
    if (!bankingInfo) throw new NotFoundException('Thiếu thông tin');
    const otpFromRedis = await this.redisService.getRedis(
      `cancel-ticket:${ticketId}`,
    );

    let result: any = null;
    if (otp === otpFromRedis) {
      // Cập nhật trạng thái ticket là CANCELLED
      const ticket = await this.findTicket(ticketId);
      if (!ticket) {
        throw new BadRequestException('Không có vé tương ứng');
      }
      ticket.status = TicketStatus.CANCELLED;
      await this.ticketRepository.save(ticket);

      // Tạo 1 cancellationRequest
      result = await this.cancelationRequestService.create({
        ticket,
        requestedBy: ticket.user,
        accountHolderName: bankingInfo.accountName,
        bankName: bankingInfo.bankName,
        accountNumber: bankingInfo.accountNumber,
      });

      // xóa otp
      await this.redisService.delRedis(`cancel-ticket:${ticketId}`);
    } else {
      throw new BadRequestException(
        'OTP sai hoặc không tồn tại, vui lòng gửi lại!!!',
      );
    }

    return {
      status: 'success',
      message:
        'hủy vé thành công, chúng tôi sẽ hoàn tiền lại trong vòng 3 ngày',
      data: result,
    };
  }

  async deleteTicket(id: string) {
    return await this.ticketRepository.delete({
      ticketId: id,
    });
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

  async findTicketsByTrip(tripId: string) {
    return this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('ticket.payment', 'payment')
      .where('ticket.trip = :tripId', { tripId })
      .select([
        'ticket.ticketId',
        'ticket.status',
        'ticket.createdAt',
        'user.userId',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.phoneNumber',
        'seat.seatId',
        'seat.seatCode',
        'payment.paymentId',
        'payment.amount',
        'payment.paymentTime',
        'payment.status',
      ])
      .orderBy('ticket.createdAt', 'DESC')
      .getMany();
  }

  async findTicketByPhone(phone: string) {
    const response = await this.ticketRepository.find({
      where: {
        user: {
          phoneNumber: phone,
        },
      },
      relations: {
        user: true,
        trip: {
          vehicle: {
            route: {
              origin: true,
              destination: true,
            },
            provider: true,
          },
        },
        seat: true,
        payment: true,
      },
    });

    return response;
  }
}
