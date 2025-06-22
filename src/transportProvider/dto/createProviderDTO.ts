import {
  IsEmail,
  IsEnum,
  IsPhoneNumber,
  IsString,
  Validate,
} from 'class-validator';
import { TransportType } from '../enum/transportEnum';

export class CreateProviderDTO {
  @IsString()
  name: string;

  @IsString()
  description?: string;

  @IsString()
  logo?: string;

  @IsPhoneNumber('VN', { message: 'phone không hợp lệ!!!' })
  phoneNumber: string;

  @IsEmail({}, { message: 'Email không hợp lệ!!!' })
  email: string;

  @IsString()
  address: string;

  @IsEnum(TransportType, { message: 'Loại phương tiện không hợp lệ!!!' })
  type: string;
}
