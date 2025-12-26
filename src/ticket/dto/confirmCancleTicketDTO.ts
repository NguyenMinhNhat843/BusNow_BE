import { BankingInfoDTO } from '@/mail/dto/bankingInfo.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { CancleTicketDTO } from './cancleTicketDTO';
import { Type } from 'class-transformer';

export class ConfirmCancleTicketDTO {
  @ValidateNested()
  @ApiProperty({ type: CancleTicketDTO })
  @Type(() => CancleTicketDTO)
  cancleTicketRequest: CancleTicketDTO;

  @ApiProperty()
  @IsString()
  otp: string;
}
