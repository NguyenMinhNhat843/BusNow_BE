import { Optional } from '@nestjs/common';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { VehicleTypeEnum } from 'src/common/enum/VehicleTypeEnum';
import { VehicleTypeBus } from 'src/common/enum/vehicleTypeForBUS';

export class CreateVehicleDTO {
  // id tự gen ra - nên không cần bỏ vô DTO
  // @IsString()
  // vehicleId: string;

  @IsString()
  @Matches(/^\d{2}[A-Z]-\d{3}\.\d{2}$/, {
    message:
      'Biển số xe phải có định dạng AXX-XXX.XX (A là chữ in hoa, X là số)',
  })
  code: string; // biển số xe

  @IsNumber()
  totalSeat: number;

  @IsEnum(VehicleTypeEnum, { message: 'Vehicle phải là BUS/TRAIN/PLANE' })
  type: VehicleTypeEnum; // Loại phương tiện: BUS/TRAIN/PLANE

  // Mặc định là false rồi chờ admin duyệt
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Cái này lấy userId trong jwt ra
  @IsString()
  @IsOptional()
  providerId?: string;

  @IsOptional()
  @IsEnum(VehicleTypeBus, {
    message: 'Nếu Vehicle là BUS thì phải có loại xe: VIP/LIMOUSINE/STANDARD',
  })
  subType?: VehicleTypeBus; // Nếu là BUS thì là xe VIP/LIMOUSINE/STANDARD
}
