import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { ApiOkResponse, ApiParam, ApiResponse } from '@nestjs/swagger';
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
    const user = (req as any).user as User | undefined;
    return this.ticketService.createTicketWithUserContext(body, user);
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

  @Get('my-ticket')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.USER]))
  async getMyTicket(@Req() req: any, @Query() query: searchTicketDTO) {
    const phoneNumber = req.user.phoneNumber as string;
    return await this.ticketService.searchTicket({
      phone: phoneNumber,
      ...query,
    });
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

  @Delete(':id')
  async deleteTicket(@Param('id') id: string) {
    return await this.ticketService.deleteTicket(id);
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
