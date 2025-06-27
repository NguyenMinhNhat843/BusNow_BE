import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from 'src/common/enum/PaymentMethod';
import { PaymentStatus } from 'src/common/enum/PaymentStatus';

export class CreateTIcketDTO {
  @IsString()
  departLocationDetailId: string;

  @IsString()
  arriveLocationDetailId: string;

  @IsString()
  tripId: string;

  @IsString()
  seatCode: string;

  @IsString()
  @IsOptional()
  typeSeat?: string;

  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ!' })
  methodPayment: string;

  @IsEnum(PaymentStatus, { message: 'Trạng thái thanh toán không hợp lệ!' })
  @IsOptional()
  statusPayment?: string;
}
