import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsString } from 'class-validator';

export class GenTripDTO {
  @IsString()
  vehicleId: string;

  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @Type(() => Number)
  @IsNumber()
  price: number; // Tiền mỗi chuyến vehicle đó
}
