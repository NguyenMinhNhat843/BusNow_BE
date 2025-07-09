import { IsDateString, IsNumber, IsString } from 'class-validator';

export class GenTripDTO {
  @IsString()
  vehicleId: string;

  @IsNumber()
  time: number; // gen trước bao nhiêu ngày

  @IsNumber()
  price: number; // Tiền mỗi chuyến vehicle đó

  @IsDateString()
  departTime: string;

  @IsNumber()
  restAtDestination: number; // được nghỉ bao lâu khi tới đích

  @IsNumber()
  duration: number; // Đi bao lâu
}
