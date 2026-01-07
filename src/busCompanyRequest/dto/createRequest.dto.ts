import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsPhoneNumber,
  IsOptional,
} from 'class-validator';

export class CreateRequestDTO {
  // Tên nhà xe
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  companyName: string;

  // Địa chỉ
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  address: string;

  // Số điện thoại
  @IsPhoneNumber('VN')
  @ApiProperty()
  phoneNumber: string;

  // Email liên hệ / dùng tạo account sau này
  @IsEmail()
  @ApiProperty()
  email: string;

  // Người đại diện pháp luật
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  representativeName: string;

  // Số giấy phép kinh doanh
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  licenseNumber: string;

  // file giấy phép
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  licenseFile?: any;
}
