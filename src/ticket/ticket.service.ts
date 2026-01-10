import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, LessThan, MoreThan, Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTIcketDTO } from './dto/createTicketDTO';
import { Seat } from 'src/seat/seat.entity';
import { User } from 'src/user/user.entity';
import { TripService } from 'src/trip/trip.service';
import { SeatService } from 'src/seat/seat.service';
import { Payment } from 'src/payment/payment.entity';
import { PaymentStatus } from 'src/common/enum/PaymentStatus';
import { FilterTicketDTO } from './dto/filterTicketDTO';
import { SortTicketEnum } from 'src/common/enum/sortTicketEnum';
import { SendTicketEmailDTO } from 'src/mail/dto/sendTicketEmail.dto';
import { MailService } from 'src/mail/mail.service';
import { CancellationRequestService } from 'src/cancellationRequest/cancellationRequest.service';
import { RedisService } from 'src/redis/redis.service';
import { UpdateTicketDTO } from './dto/updateTicketDTO';
import { searchTicketDTO } from './dto/searchTicketDTO';
import { CancleTicketDTO } from './dto/cancleTicketDTO';
import { ConfirmCancleTicketDTO } from './dto/confirmCancleTicketDTO';
import { TicketStatus, TicketUsedStatus } from './type';
import { Trip } from '@/trip/trip.entity';
import { RoleEnum } from '@/common/enum/RoleEnum';
import { UserService } from '@/user/user.service';
import { now } from 'moment';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly tripService: TripService,
    private readonly seatService: SeatService,
    private dataSource: DataSource,
    private mailService: MailService,
    private cancelationRequestService: CancellationRequestService,
    private redisService: RedisService,
    private userService: UserService,
  ) {}

  async createTicket(
    ticketData: CreateTIcketDTO,
    user: User,
    statusTicket: TicketStatus = TicketStatus.UNPAID,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { tripId, seatCode, methodPayment, statusPayment } = ticketData;

      // Lấy trip trong transaction
      const trip = await queryRunner.manager.findOne(Trip, {
        where: { tripId },
        relations: ['vehicle'],
      });

      if (!trip) {
        throw new BadRequestException(
          'Chuyến đi không tồn tại trong hệ thống!',
        );
      }

      // Check đủ ghế trống
      if (trip.availabelSeat < seatCode.length) {
        throw new BadRequestException('Không đủ ghế trống');
      }

      // Validate seatCode hợp lệ
      const totalSeat = trip.vehicle.totalSeat;
      const invalidSeat = seatCode.find((seat) => seat < 1 || seat > totalSeat);
      if (invalidSeat) {
        throw new BadRequestException(
          `Mã ghế ${invalidSeat} không hợp lệ. Chỉ từ 1 đến ${totalSeat}`,
        );
      }

      // Check seat đã tồn tại (atomic)
      const existedSeats = await queryRunner.manager.find(Seat, {
        where: {
          trip: { tripId },
          seatCode: In(seatCode),
        },
      });

      if (existedSeats.length > 0) {
        throw new BadRequestException(
          `Ghế ${existedSeats.map((s) => s.seatCode).join(', ')} đã được đặt`,
        );
      }

      const createdTickets: Ticket[] = [];
      // Tạo ticket + payment + seat
      for (const seat of seatCode) {
        const payment = queryRunner.manager.create(Payment, {
          amount: trip.price,
          paymentTime: new Date(),
          method: methodPayment,
          status: statusPayment ?? PaymentStatus.PENDING,
          user,
        });
        await queryRunner.manager.save(payment);

        const newSeat = queryRunner.manager.create(Seat, {
          seatCode: seat,
          trip,
          isBooked: true,
        });
        await queryRunner.manager.save(newSeat);

        const newTicket = queryRunner.manager.create(Ticket, {
          trip,
          seat: newSeat,
          seatCode: seat,
          status: statusTicket,
          user,
          payment,
          ticketTime: new Date(),
        });
        await queryRunner.manager.save(newTicket);

        createdTickets.push(newTicket);
      }
      // Update số ghế trống
      trip.availabelSeat -= seatCode.length;
      await queryRunner.manager.save(trip);

      // Commit transaction
      await queryRunner.commitTransaction();

      for (const t of createdTickets) {
        const ticket = await this.findTicket(t.ticketId);
        if (!ticket) continue;

        const emailData: SendTicketEmailDTO = {
          ticketId: ticket.ticketId,
          fullName: `${ticket.user.firstName} ${ticket.user.lastName}`,
          busName: ticket.trip.vehicle.provider?.lastName || 'Nhà xe',
          busCode: ticket.trip.vehicle.code,
          departDate: ticket.trip.departDate.toISOString(),
          price: ticket.trip.price,
          seatCode: ticket.seat.seatCode,
          origin: ticket.trip.vehicle.route.origin.name,
          destination: ticket.trip.vehicle.route.destination.name,
        };

        await this.mailService.sendTicketEmail(user.email, emailData);
      }
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private validateGuestInfo(body: CreateTIcketDTO) {
    if (!body.firstName || !body.lastName || !body.email) {
      throw new BadRequestException(
        'Guest bắt buộc phải có firstName, lastName và email',
      );
    }
  }

  async createTicketWithUserContext(
    ticketData: CreateTIcketDTO,
    authUser?: User,
  ) {
    let user: User;

    // ===== CASE 1: Đã đăng nhập =====
    if (authUser) {
      if (authUser.role !== RoleEnum.USER) {
        throw new BadRequestException('User không hợp lệ để đặt vé');
      }
      user = authUser;
    } else {
      // ===== CASE 2: Guest =====
      if (!ticketData.phone) {
        throw new BadRequestException('Guest bắt buộc nhập số điện thoại');
      }

      const existed = await this.userService.findUserByPhoneNumber(
        ticketData.phone,
      );

      if (!existed) {
        this.validateGuestInfo(ticketData);

        user = await this.userService.createGuest(
          ticketData.firstName!,
          ticketData.lastName!,
          ticketData.email!,
          ticketData.phone,
        );
      } else {
        if (existed.role !== RoleEnum.GUEST) {
          throw new BadRequestException(
            'Số điện thoại đã được đăng ký tài khoản, vui lòng đăng nhập',
          );
        }

        await this.userService.updateProfile(
          {
            firstName: ticketData.firstName,
            lastName: ticketData.lastName,
          },
          existed.email,
        );

        user = existed;
      }
    }

    // ===== TẠO VÉ =====
    return this.createTicket(ticketData, user);
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

  async cancleTicket(payload: CancleTicketDTO, userId: string) {
    const { ticketId, bankingInfo } = payload;
    const ticket = await this.findTicket(ticketId);
    if (!ticket) throw new NotFoundException('Ticket không tồn tại');

    if (ticket.status === TicketStatus.CANCELLED) return;

    if (ticket.status !== TicketStatus.PAID) {
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

  async searchTicket(payload: searchTicketDTO) {
    const { limit = 10, page = 1, ticketId, status } = payload;

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('ticket.trip', 'trip')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.route', 'route')
      .leftJoinAndSelect('route.destination', 'destination')
      .leftJoinAndSelect('route.origin', 'origin')
      .leftJoinAndSelect('vehicle.provider', 'provider')
      .leftJoinAndSelect('ticket.payment', 'payment')
      .leftJoinAndSelect('ticket.cancellationRequest', 'cancellationRequest');

    if (ticketId) {
      query.andWhere('ticket.ticketId = :ticketId', { ticketId });
    }

    if (status === TicketUsedStatus.USED) {
      query.andWhere('trip.departDate < :now', { now: new Date() });
    } else if (status === TicketUsedStatus.NOT_USED) {
      query.andWhere('trip.departDate > :now', { now: new Date() });
    }

    query
      .orderBy('ticket.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((ticket) => ({
        ...ticket,
        used: ticket.trip?.departDate < new Date(),
      })),
      total,
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
