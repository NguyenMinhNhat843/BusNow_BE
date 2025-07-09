import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { BusTypeEnum } from 'src/enum/BusTypeEnum';

export class CreateVehicleDTO {
  @IsString()
  @Matches(/^\d{2}[A-Z]-\d{3}\.\d{2}$/, {
    message:
      'Biển số xe phải có định dạng AXX-XXX.XX (A là chữ in hoa, X là số)',
  })
  code: string; // biển số xe

  @IsNumber()
  totalSeat: number;

  @IsEnum(BusTypeEnum, { message: 'Xe chỉ có thể là VIP/STANDRD/LIMOUSINE' })
  busType: BusTypeEnum;

  // Cái này lấy userId trong jwt ra
  @IsString()
  @IsOptional()
  providerId?: string;

  @IsString()
  routeId: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Giờ chạy phải có định dạng HH:mm (ví dụ: 09:00 hoặc 22:30)',
  })
  departHour: string; // Giờ chạy mỗi ngày
}
