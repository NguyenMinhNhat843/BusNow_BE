import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumberString,
  IsDateString,
} from 'class-validator';
import { CancellationStatus } from 'src/common/enum/RefundEnum';

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
  @IsEnum(CancellationStatus)
  status?: CancellationStatus;

  @IsOptional()
  @IsUUID()
  handledById?: string;

  @IsOptional()
  @IsDateString()
  refundedAt?: Date;
}
