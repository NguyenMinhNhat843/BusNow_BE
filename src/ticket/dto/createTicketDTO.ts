import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod } from 'src/common/enum/PaymentMethod';
import { PaymentStatus } from 'src/common/enum/PaymentStatus';

export class CreateTIcketDTO {
  @IsString()
  tripId: string;

  @IsArray()
  seatCode: number[];

  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ!' })
  methodPayment: string;

  @IsEnum(PaymentStatus, { message: 'Trạng thái thanh toán không hợp lệ!' })
  @IsOptional()
  statusPayment?: string;

  // Trong trường hợp guest
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
