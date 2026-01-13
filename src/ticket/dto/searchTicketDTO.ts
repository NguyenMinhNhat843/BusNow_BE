import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsUUID,
  Min,
} from 'class-validator';
import { TicketStatus, TicketUsedStatus } from '../type';

export class searchTicketDTO {
  @IsUUID()
  @ApiPropertyOptional()
  @IsOptional()
  ticketId?: string;

  @IsUUID()
  @ApiPropertyOptional()
  @IsOptional()
  providerId?: string;

  @IsPhoneNumber('VN')
  @ApiPropertyOptional()
  @IsOptional()
  providerPhone?: string;

  @IsInt()
  @ApiPropertyOptional()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @ApiPropertyOptional()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  phone?: string;

  @IsEnum(TicketUsedStatus)
  @ApiPropertyOptional({ enum: TicketUsedStatus })
  @IsOptional()
  status?: TicketUsedStatus;

  @IsUUID()
  @ApiPropertyOptional()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  vehicleCode?: string;

  @IsUUID()
  @ApiPropertyOptional()
  @IsOptional()
  tripId?: string;

  @IsEnum(TicketStatus)
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  statusPayment?: TicketStatus;
}
