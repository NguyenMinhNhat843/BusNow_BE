import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SortByEnum } from 'src/common/enum/SortByEnum';
import { VehicleTypeBus } from 'src/common/enum/vehicleTypeForBUS';

export class SearchTripDTO {
  @IsString({ message: 'điểm đón phải là chuỗi' })
  fromLocationId: string;

  @IsString({ message: 'điểm đến phải là chuỗi' })
  toLocationId: string;

  @IsDateString(
    {},
    { message: 'Thời gian khởi hành phải là định dạng ngày hợp lệ' },
  )
  departTime: Date;

  // phân trang
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber({}, { message: 'Trang phải là số' })
  page: number;
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber({}, { message: 'Số lượng chuyến đi mỗi trang phải là số' })
  limit: number;

  // lọc
  @IsArray()
  @IsOptional()
  @IsString({ each: true, message: 'Tên nhà cung cấp phải là chuỗi' })
  @Transform(
    ({ value }) => (Array.isArray(value) ? value : [value]) as string[],
  )
  providerName?: string[];
  @IsArray()
  @IsEnum(VehicleTypeBus, {
    each: true,
    message: 'Loại phương tiện không hợp lệ',
  })
  @IsOptional()
  @Transform(
    ({ value }) => (Array.isArray(value) ? value : [value]) as string[],
  )
  vehicleSubType?: string[];
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber({}, { message: 'Giá tối thiểu phải là số' })
  @IsOptional()
  minPrice?: number;
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber({}, { message: 'Giá tối đa phải là số' })
  @IsOptional()
  maxPrice?: number;

  // sắp xếp
  @IsEnum(SortByEnum, { message: 'Phương thức sắp xếp không hợp lệ' })
  @IsOptional()
  sortBy?: string;
}
