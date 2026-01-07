import { IsEmail, IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export class CreateRequestDTO {
  // Tên nhà xe
  @IsString()
  @IsNotEmpty()
  companyName: string;

  // Địa chỉ
  @IsString()
  @IsNotEmpty()
  address: string;

  // Số điện thoại
  @IsPhoneNumber('VN')
  phoneNumber: string;

  // Email liên hệ / dùng tạo account sau này
  @IsEmail()
  email: string;

  // Người đại diện pháp luật
  @IsString()
  @IsNotEmpty()
  representativeName: string;

  // Số giấy phép kinh doanh
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  // URL file giấy phép
  @IsString()
  @IsNotEmpty()
  licenseFileUrl: string;
}
