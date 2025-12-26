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
import { BankingInfoDTO } from 'src/mail/dto/bankingInfo.dto';
import { OptionalJwtAuthGuard } from '@/common/guard/OptionalJwtAuthGuard';
import { UpdateTicketDTO } from './dto/updateTicketDTO';
import { Ticket } from './ticket.entity';
import { ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { searchTicketDTO } from './dto/searchTicketDTO';
import { CancleTicketDTO } from './dto/cancleTicketDTO';
import { ConfirmCancleTicketDTO } from './dto/confirmCancleTicketDTO';

@Controller('ticket')
export class ticketController {
  constructor(
    private readonly ticketService: TicketService,
    private userService: UserService,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async createTicket(@Body() body: CreateTIcketDTO, @Req() req: Request) {
    // Lấy thông tin user từ request (nếu đã đăng nhập)
    const user = ((req as any).user as User) || null;

    // Trường hợp chưa đăng nhập (guest)
    if (user === null) {
      // Nếu guest có cung cấp số điện thoại
      if (body.phone) {
        const guest = await this.userService.findUserByPhoneNumber(body.phone);

        if (!guest) {
          // Guest chưa tồn tại trong hệ thống → bắt buộc phải có đầy đủ thông tin
          if (!body.firstName) {
            throw new BadRequestException('Phải có firstName');
          }
          if (!body.lastName) {
            throw new BadRequestException('Phải có lastName');
          }
          if (!body.email) {
            throw new BadRequestException('Phải có email');
          }

          // Tạo mới 1 guest user
          const res = await this.userService.createGuest(
            body.firstName,
            body.lastName,
            body.email,
            body.phone,
          );

          // Tạo vé cho guest mới tạo
          const result = await this.ticketService.createTicket(body, res);
          return result;
        } else {
          // Nếu số điện thoại đã tồn tại trong hệ thống
          if (guest.role === RoleEnum.GUEST) {
            // Cập nhật lại thông tin guest (trường hợp guest quay lại đặt vé)
            await this.userService.updateProfile(
              {
                firstName: body.firstName,
                lastName: body.lastName,
              },
              guest.email,
            );

            // Tạo vé cho guest
            const result = await this.ticketService.createTicket(body, guest);
            return result;
          } else {
            // Nếu số điện thoại thuộc user đã đăng ký → yêu cầu đăng nhập
            throw new BadRequestException(
              'Số điện thoại đã được đăng ký tài khoản, vui lòng đăng nhập để thao tác!!!',
            );
          }
        }
      } else {
        // Guest không nhập số điện thoại → không cho đặt vé
        throw new BadRequestException(
          'Bạn đang là guest, vui lòng nhập phone để đặt vé',
        );
      }

      // Trường hợp đã đăng nhập với role USER
    } else if (user.role === RoleEnum.USER) {
      const result = await this.ticketService.createTicket(body, user);
      return result;

      // Các role khác (admin, staff, ...) không được đặt vé
    } else {
      throw new BadRequestException('User hoặc Guest mới được đặt vé');
    }
  }

  @Put()
  @UseGuards(JwtAuthGuard, new RolesGuard(['provider']))
  async updateTicket(@Body() body: UpdateTicketDTO): Promise<Ticket> {
    return await this.ticketService.updateTicket(body);
  }

  @Post('search')
  async searchTicket(@Body() body: searchTicketDTO) {
    return await this.ticketService.searchTicket(body);
  }

  @Put('cancle-ticket')
  @UseGuards(OptionalJwtAuthGuard)
  async cancleTicket(@Body() body: CancleTicketDTO, @Req() req: Request) {
    const user = ((req as any).user as User) || null;
    return await this.ticketService.cancleTicket(body, user.userId);
  }

  @Post('confirm-cancle')
  async confirmCancleTicket(
    @Body()
    body: ConfirmCancleTicketDTO,
  ) {
    return await this.ticketService.confirmCancleTicket(body);
  }

  @Get('my-ticket')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.USER]))
  async getMyTicket(@Req() req: any) {
    const phoneNumber = req.user.phoneNumber as string;
    return await this.ticketService.findTicketByPhone(phoneNumber);
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

    return result;
  }
}
