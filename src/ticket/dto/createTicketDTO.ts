import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from 'src/common/enum/PaymentMethod';
import { PaymentStatus } from 'src/common/enum/PaymentStatus';

export class CreateTIcketDTO {
  @ApiProperty({
    description: 'ID chuyến xe',
    example: 'trip_123456',
  })
  @IsString()
  tripId: string;

  @ApiProperty({
    description: 'Danh sách mã ghế',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  seatCode: number[];

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod, {
    message: 'Phương thức thanh toán không hợp lệ!',
  })
  methodPayment: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Trạng thái thanh toán',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  @IsEnum(PaymentStatus, {
    message: 'Trạng thái thanh toán không hợp lệ!',
  })
  @IsOptional()
  statusPayment?: string;

  // Guest info
  @ApiPropertyOptional({
    description: 'Tên khách (guest)',
    example: 'Nguyen',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Họ khách (guest)',
    example: 'Van A',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại khách',
    example: '0987654321',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email khách',
    example: 'guest@gmail.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
