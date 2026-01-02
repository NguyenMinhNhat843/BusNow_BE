import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { TicketStatus } from '../type';

export class UpdateTicketDTO {
  @ApiProperty()
  @IsUUID()
  ticketId: string;

  @ApiProperty()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
