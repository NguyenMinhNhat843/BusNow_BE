import { IsDateString, IsNumber, IsString, Matches } from 'class-validator';

export class createTripDTO {
  @IsNumber()
  price: number;

  @IsDateString()
  departTime: Date;

  @IsDateString()
  arriveTime: Date;

  @IsString({ message: 'Điểm đón phải là chuỗi' })
  @Matches(/^[\p{L}\d\s]+$/u, {
    message:
      'Tên điểm đón không hợp lệ (chỉ chấp nhận chữ, số và khoảng trắng)',
  })
  fromLocationName: string;

  @IsString({ message: 'Điểm đến phải là chuỗi' })
  @Matches(/^[\p{L}\d\s]+$/u, {
    message:
      'Tên điểm đón không hợp lệ (chỉ chấp nhận chữ, số và khoảng trắng)',
  })
  toLocationName: string;

  @IsString()
  @Matches(/^\d{2}[A-Z]-\d{3}\.\d{2}$/, {
    message: 'Biển số xe phải theo định dạng ví dụ: 29A-123.45',
  })
  vehicleCodeNumber: string; // biển số xe
}
