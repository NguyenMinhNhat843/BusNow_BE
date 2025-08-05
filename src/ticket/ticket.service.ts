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
import { SendTicketEmailDTO } from 'src/mail/dto/sendTicketEmail.dto';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';
import { BankingInfoDTO } from 'src/mail/dto/bankingInfo.dto';
import { CancellationRequestService } from 'src/cancellationRequest/cancellationRequest.service';
import { RedisService } from 'src/redis/redis.service';

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

  async sendRequestCancleTicket(
    ticketId: string,
    userId: string,
    bankingInfo: BankingInfoDTO,
  ) {
    const ticket = await this.findTicket(ticketId);
    if (!ticket) {
      throw new BadRequestException(
        'Vé không tồn tại hoặc không thuộc về người dùng này',
      );
    }

    // Kiểm tra email gửi yêu cầu có giống với email lúc đặt vé không
    if (bankingInfo.emailRequest != ticket.user.email) {
      console.log(bankingInfo.emailRequest);
      console.log(ticket.user.email);
      throw new BadRequestException('Email hủy vé không khớp với email đặt vé');
    }

    // send otp gmail
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

  async confirmCancleTicket(
    ticketId: string,
    bankingInfo: BankingInfoDTO,
    otp: string,
  ) {
    // Kiểm tra otp
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
        accountHolderName: bankingInfo.bankAccountName,
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
    // find() method chỉ chỉ định field của entity gốc (Ticket), muốn lấy cái khác phải dùng quẻyBuilder
    const response = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.trip', 'trip')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('ticket.payment', 'payment')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.route', 'route')
      .leftJoinAndSelect('vehicle.provider', 'provider')
      .leftJoinAndSelect('route.origin', 'origin')
      .leftJoinAndSelect('route.destination', 'destination')
      .where('user.phoneNumber = :phone', { phone: phone })
      .andWhere('ticket.status != :status', { status: TicketStatus.CANCELLED })
      .select([
        'ticket.ticketId',
        'ticket.status',
        'user.userId',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.phoneNumber',
        'user.role',
        'trip.tripId',
        'trip.price',
        'trip.departDate',
        'trip.type',
        'trip.tripStatus',
        'seat.seatId',
        'seat.seatCode',
        'payment.paymentId',
        'payment.paymentTime',
        'payment.method',
        'payment.status',
        'vehicle.vehicleId',
        'vehicle.code',
        'vehicle.busType',
        'route.routeId',
        'origin.locationId',
        'origin.name',
        'destination.locationId',
        'destination.name',
        'provider.firstName',
        'provider.lastName',
        'provider.userId',
      ])
      .getMany();
    // tên, phone, email, route: from - to, departTime, seat, paymentTIme, price, status
    if (!response.length) {
      return { user: null, tickets: [] };
    }

    const user = {
      userId: response[0].user.userId,
      fullName: response[0].user.firstName + ' ' + response[0].user.lastName,
      email: response[0].user.email,
      phoneNumber: response[0].user.phoneNumber,
      role: response[0].user.role,
    };

    return {
      user,
      tickets: response,
    };
  }
}
