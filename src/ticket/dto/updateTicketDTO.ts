import { TicketStatus } from '@/common/enum/TicketStatus';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

export class UpdateTicketDTO {
  @ApiProperty()
  @IsUUID()
  ticketId: string;

  @ApiProperty()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
