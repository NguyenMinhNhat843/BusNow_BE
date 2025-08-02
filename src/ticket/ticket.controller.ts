import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateTIcketDTO } from './dto/createTicketDTO';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/user/user.entity';
import { RolesGuard } from 'src/user/guards/roles.guard';
import { FilterTicketDTO } from './dto/filterTicketDTO';
import { RoleEnum } from 'src/common/enum/RoleEnum';
import { UserService } from 'src/user/user.service';
import { JwtPayload } from 'src/interface/JwtPayload';
import { BankingInfoDTO } from 'src/mail/dto/bankingInfo.dto';

@Controller('ticket')
export class ticketController {
  constructor(
    private readonly ticketService: TicketService,
    private userService: UserService,
  ) {}

  @Post()
  // @UseGuards(new RolesGuard([RoleEnum.USER, RoleEnum.GUEST]))
  async createTicket(@Body() body: CreateTIcketDTO, @Req() req: Request) {
    const user = ((req as any).user as User) || null;

    if (user === null) {
      if (body.phone) {
        const guest = await this.userService.findUserByPhoneNumber(body.phone);
        if (!guest) {
          // check tồn tại thông tin
          if (!body.firstName) {
            throw new BadRequestException('Phải có firstName');
          }
          if (!body.lastName) {
            throw new BadRequestException('Phải có lastName');
          }
          if (!body.email) {
            throw new BadRequestException('Phải có email');
          }
          // Tạo 1 guest
          const res = await this.userService.createGuest(
            body.firstName,
            body.lastName,
            body.email,
            body.phone,
          );
          const result = await this.ticketService.createTicket(body, res);
          return result;
        } else {
          // Kiểm tra role có phải guest ko
          if (guest.role === RoleEnum.GUEST) {
            // update lại thông tin
            await this.userService.updateProfile(
              {
                firstName: body.firstName,
                lastName: body.lastName,
              },
              guest.email,
            );

            // Tạo vé
            const result = await this.ticketService.createTicket(body, guest);
            return result;
          } else {
            throw new BadRequestException(
              'Số điện thoại đã được đăng ký tìa khoản, vui lòng đăng nhập để thao tác!!!',
            );
          }
        }
      } else {
        throw new BadRequestException(
          'Bạn đang là guest, vui lòng nhập phone để đặt vé',
        );
      }
      // đặt vé với guest
    } else if (user.role === RoleEnum.USER) {
      const result = await this.ticketService.createTicket(body, user);
      return result;
    } else {
      throw new BadRequestException('User hoặc Guest mới được đặt vé');
    }
  }

  @Put('send-mail-cancle-ticket')
  async cancleTicket(
    @Body() body: { ticketId: string; bankingInfo: BankingInfoDTO },
    @Req() req: any,
  ) {
    const userId = req.userId as string;
    return await this.ticketService.sendRequestCancleTicket(
      body.ticketId,
      userId,
      body.bankingInfo,
    );
  }

  @Post('confirm-cancle')
  async confirmCancleTicket(
    @Body()
    body: {
      ticketId: string;
      bankingInfo: BankingInfoDTO;
      otp: string;
    },
    @Req() req: any,
  ) {
    const userId = req.userId as string;
    return await this.ticketService.confirmCancleTicket(
      body.ticketId,
      body.bankingInfo,
      body.otp,
    );
  }

  @Get('my-ticket')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.USER]))
  async getMyTicket(@Req() req: any) {
    const phoneNumber = req.user.phoneNumber as string;
    const result = await this.ticketService.findTicketByPhone(phoneNumber);
    const flattened = result.tickets.map((ticket) => ({
      ticketId: ticket.ticketId,
      providerId: ticket.trip.vehicle.provider.userId,
      providerName: ticket.trip.vehicle.provider.lastName,
      status: ticket.status,
      seatCode: ticket.seat.seatCode,

      price: ticket.trip.price,
      departDate: ticket.trip.departDate,
      tripStatus: ticket.trip.tripStatus,
      tripType: ticket.trip.type,

      vehicleCode: ticket.trip.vehicle.code,
      vehicleType: ticket.trip.vehicle.busType,

      origin: ticket.trip.vehicle.route.origin.name,
      destination: ticket.trip.vehicle.route.destination.name,

      paymentMethod: ticket.payment?.method,
      paymentStatus: ticket.payment?.status,
      paymentTime: ticket.payment?.paymentTime,
    }));

    return {
      status: 'success',
      data: {
        user: result.user,
        tickets: flattened,
      },
    };
  }

  @Post('filter-ticket')
  @UseGuards(JwtAuthGuard, new RolesGuard(['admin']))
  async filterTicket(@Body() body: FilterTicketDTO) {
    const response = await this.ticketService.filterTicketPagination(body);
    return response;
  }

  @Get('by-trip/:tripId')
  async getTicketsByTrip(@Param('tripId') tripId: string) {
    const tickets = await this.ticketService.findTicketsByTrip(tripId);

    const result = tickets.map((t) => {
      const {
        ticketId,
        status,
        createdAt,
        user: { userId, firstName, lastName, email, phoneNumber } = {},
        seat: { seatId, seatCode } = {},
        payment: { paymentId, amount, paymentTime, status: paymentStatus } = {},
      } = t;

      return {
        ticketId,
        status,
        createdAt,
        userId,
        firstName,
        lastName,
        email,
        phoneNumber,
        seatId,
        seatCode,
        paymentId,
        amount,
        paymentTime,
        paymentStatus,
      };
    });

    return {
      status: 'success',
      data: result,
    };
  }
  @Get('by-phone/:phone')
  async findTicketByPhone(@Param('phone') phone: string) {
    const result = await this.ticketService.findTicketByPhone(phone);

    const flattened = result.tickets.map((ticket) => ({
      ticketId: ticket.ticketId,
      providerId: ticket.trip.vehicle.provider.userId,
      providerName: ticket.trip.vehicle.provider.lastName,
      status: ticket.status,
      seatCode: ticket.seat.seatCode,

      price: ticket.trip.price,
      departDate: ticket.trip.departDate,
      tripStatus: ticket.trip.tripStatus,
      tripType: ticket.trip.type,

      vehicleCode: ticket.trip.vehicle.code,
      vehicleType: ticket.trip.vehicle.busType,

      origin: ticket.trip.vehicle.route.origin.name,
      destination: ticket.trip.vehicle.route.destination.name,

      paymentMethod: ticket.payment?.method,
      paymentStatus: ticket.payment?.status,
      paymentTime: ticket.payment?.paymentTime,
    }));

    return {
      status: 'success',
      data: {
        user: result.user,
        tickets: flattened,
      },
    };
  }
}
