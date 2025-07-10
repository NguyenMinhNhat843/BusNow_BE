import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsString } from 'class-validator';

export class GenTripDTO {
  @IsString()
  vehicleId: string;

  @Type(() => Number)
  @IsNumber()
  time: number; // gen trước bao nhiêu ngày

  @Type(() => Number)
  @IsNumber()
  price: number; // Tiền mỗi chuyến vehicle đó
}
