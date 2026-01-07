import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleEnum } from 'src/common/enum/RoleEnum';

export class RegisterDTO {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email đăng ký',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    example: 'Abc@1234',
    description:
      'Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt và tối thiểu 8 ký tự',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/, {
    message:
      'Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt và tối thiểu 8 ký tự',
  })
  password: string;

  @ApiProperty({
    example: 'Nguyễn Văn',
    description: 'Họ và tên đệm',
  })
  @IsNotEmpty({ message: 'Họ và tên đệm không được để trống' })
  firstName: string;

  @ApiProperty({
    example: 'A',
    description: 'Tên',
  })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  lastName: string;

  @ApiPropertyOptional({
    example: '0987654321',
    description: 'Số điện thoại (10 chữ số)',
  })
  @IsNumberString({}, { message: 'Số điện thoại chỉ được chứa số' })
  @Length(10, 10, { message: 'Số điện thoại phải có đúng 10 chữ số' })
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'Hà Nội, Việt Nam',
    description: 'Địa chỉ',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Mã OTP xác thực',
  })
  @IsOptional()
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  otp?: string;

  @ApiProperty({
    enum: RoleEnum,
    example: RoleEnum.USER,
    description: 'Vai trò người dùng',
  })
  @IsEnum(RoleEnum, { message: 'Role không hợp lệ' })
  role: RoleEnum;

  @ApiPropertyOptional({
    example: false,
    description: 'Admin nội bộ tạo tài khoản',
  })
  @IsBoolean()
  @IsOptional()
  isInternalAdminCreate?: boolean;
}
