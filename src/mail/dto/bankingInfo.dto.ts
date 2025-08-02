import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class BankingInfoDTO {
  @IsNotEmpty({ message: 'Tên chủ tài khoản không được để trống' })
  @IsString({ message: 'Tên chủ tài khoản phải là chuỗi' })
  bankAccountName: string;

  @IsNotEmpty({ message: 'Số tài khoản không được để trống' })
  @IsString({ message: 'Số tài khoản phải là chuỗi' })
  @Matches(/^\d+$/, { message: 'Số tài khoản chỉ được chứa chữ số' })
  @Length(6, 20, { message: 'Số tài khoản phải có từ 6 đến 20 chữ số' })
  accountNumber: string;

  @IsNotEmpty({ message: 'Tên ngân hàng không được để trống' })
  @IsString({ message: 'Tên ngân hàng phải là chuỗi' })
  bankName: string;

  @IsEmail()
  emailRequest: string;
}
