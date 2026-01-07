import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDTO {
  @ApiPropertyOptional()
  @IsString({ message: 'Email không hợp lệ' })
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'Tên không hợp lệ' })
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'Địa chỉ không hợp lệ' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  birthDate?: Date;
}
