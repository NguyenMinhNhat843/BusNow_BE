import { Optional } from '@nestjs/common';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { VehicleTypeEnum } from 'src/common/enum/VehicleTypeEnum';
import { VehicleTypeBus } from 'src/common/enum/vehicleTypeForBUS';
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

  @IsDateString()
  departTime: Date;

  repeatsDay?: number;
}
