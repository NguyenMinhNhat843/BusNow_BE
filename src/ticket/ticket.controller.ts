import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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

@Controller('ticket')
export class ticketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.USER]))
  async createTicket(@Body() body: CreateTIcketDTO, @Req() req: Request) {
    const user = (req as any).user as User;
    const result = await this.ticketService.createTicket(body, user);

    return result;
  }

  @Put('cancle-ticket')
  @UseGuards(JwtAuthGuard)
  async cancleTicket(@Body() body: { ticketId: string }, @Req() req: any) {
    const userId = req.userId as string;
    return await this.ticketService.cancleTicket(body.ticketId, userId);
  }

  @Get('my-ticket')
  @UseGuards(JwtAuthGuard)
  async getMyTicket(@Req() req: any) {
    const userId = req.userId as string;
    const response = await this.ticketService.getListTicketByUserId(userId);
    return {
      status: 'success',
      data: response,
    };
  }

  @Post('filter-ticket')
  @UseGuards(JwtAuthGuard, new RolesGuard(['admin']))
  async filterTicket(@Body() body: FilterTicketDTO) {
    const response = await this.ticketService.filterTicketPagination(body);
    return response;
  }

  @Get('by-trip/:tripId')
  @UseGuards(JwtAuthGuard, new RolesGuard(['provider']))
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
}
