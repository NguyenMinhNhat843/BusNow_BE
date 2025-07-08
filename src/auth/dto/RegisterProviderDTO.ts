import { IsEmail, IsPhoneNumber, IsString, Matches } from 'class-validator';

export class RegisterProviderDTO {
  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @Matches(/^0\d{9}$/, {
    message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0',
  })
  phoneNumber: string;

  @IsString()
  password: string;

  @IsString()
  address: string;
}
