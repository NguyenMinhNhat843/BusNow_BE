import { Body, Controller, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CreateTIcketDTO } from './dto/createTicketDTO';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/user/user.entity';

@Controller('ticket')
export class ticketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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
}
