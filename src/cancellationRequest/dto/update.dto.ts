import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumberString,
  IsDateString,
} from 'class-validator';
import { REFUND_STATUS, RefundStatusType } from '../type/type';

export class UpdateCancellationRequestDto {
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @IsOptional()
  @IsUUID()
  requestedById?: string;

  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsNumberString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(REFUND_STATUS)
  status?: RefundStatusType;

  @IsOptional()
  @IsUUID()
  handledById?: string;

  @IsOptional()
  @IsDateString()
  refundedAt?: Date;
}
