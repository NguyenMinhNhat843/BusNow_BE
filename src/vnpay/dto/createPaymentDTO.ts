import { CreateTIcketDTO } from '@/ticket/dto/createTicketDTO';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Số tiền thanh toán (VND)', example: 100000 })
  @IsNotEmpty()
  @IsNumber()
  amount: number; // VND

  @ApiProperty({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toán vé xe',
  })
  @IsNotEmpty()
  @IsString()
  orderInfo: string;

  @ApiProperty({ type: CreateTIcketDTO })
  @ValidateNested()
  @Type(() => CreateTIcketDTO)
  bookingInfo: CreateTIcketDTO;
}
