import { BankingInfoDTO } from '@/mail/dto/bankingInfo.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CancleTicketDTO {
  @IsUUID()
  @ApiProperty()
  ticketId: string;

  @ApiPropertyOptional({ type: BankingInfoDTO })
  @IsOptional()
  bankingInfo?: BankingInfoDTO;
}
