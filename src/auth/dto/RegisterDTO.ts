import { Optional } from '@nestjs/common';
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
  ValidateIf,
} from 'class-validator';
import { RoleEnum } from 'src/common/enum/RoleEnum';
import { TransportType } from 'src/transportProvider/enum/transportEnum';

export class RegisterDTO {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/, {
    message:
      'Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt và tối thiểu 8 ký tự',
  })
  password: string;

  @IsNotEmpty({ message: 'Họ và tên đệm khoogn được để trống' })
  firstName: string;

  @IsNotEmpty({ message: 'Tên không được để trống' })
  lastName: string;

  @IsNumberString({}, { message: 'Số điện thoại chỉ được chứa số' })
  @Length(10, 10, { message: 'Số điện thoại phải có đúng 10 chữ số' })
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(TransportType, {
    message: 'Nếu là provider thì phải có loại phương tiện',
  })
  @IsOptional()
  type?: TransportType | null;

  // otp
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsOptional()
  otp?: string;

  @IsEnum(RoleEnum, { message: 'Role không hợp lệ' })
  role: RoleEnum;

  @IsBoolean()
  @IsOptional()
  isInternalAdminCreate?: boolean;
}
