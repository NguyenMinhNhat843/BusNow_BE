import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class SearchTripDTO {
  @IsString({ message: 'điểm đón phải là chuỗi' })
  fromLocationName: string;

  @IsString({ message: 'điểm đến phải là chuỗi' })
  toLocationName: string;

  @IsDateString(
    {},
    { message: 'Thời gian khởi hành phải là định dạng ngày hợp lệ' },
  )
  @IsOptional()
  startTime?: Date;
}
