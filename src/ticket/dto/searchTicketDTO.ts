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
import { TicketUsedStatus } from '../type';

export class searchTicketDTO {
  @IsUUID()
  @ApiPropertyOptional()
  @IsOptional()
  ticketId?: string;

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
  @IsPhoneNumber('VN')
  phone?: string;

  @IsEnum(TicketUsedStatus)
  @ApiPropertyOptional({ enum: TicketUsedStatus })
  @IsOptional()
  status?: TicketUsedStatus;
}
