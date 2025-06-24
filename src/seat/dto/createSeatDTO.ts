import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { SeatType } from 'src/common/enum/SeatType';

export class CreateSeatDTO {
  @IsString()
  seatCode: string;

  @IsOptional()
  @IsEnum(SeatType, { message: 'typeSeat phải là  VIP/STANDARD' })
  typeSeat?: string | null; // Chỉ có khi type vehicle !== BUS

  @IsUUID()
  tripId: string;
}
