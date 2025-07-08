import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { SortTicketEnum } from 'src/common/enum/sortTicketEnum';
import { TicketStatus } from 'src/common/enum/TicketStatus';
import { TimeRangeDTO } from './timeRangeDTO';
import { Type } from 'class-transformer';

export class FilterTicketDTO {
  @IsNumber()
  numberPerPage: number;

  @IsNumber()
  page: number;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimeRangeDTO)
  time?: TimeRangeDTO;

  @IsOptional()
  @IsEnum(TicketStatus, { message: 'Status không hợp lệ' })
  ticketStatus: string;

  @IsOptional()
  @IsEnum(SortTicketEnum)
  sortBy?: SortTicketEnum;
}
