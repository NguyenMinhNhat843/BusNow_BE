import { RoleEnum } from '@/common/enum/RoleEnum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.png',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 'Nguyễn' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Văn A' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  // provider: ngày thành lập | user: ngày sinh
  @ApiPropertyOptional({
    example: '1999-01-01',
    description: 'Ngày sinh hoặc ngày thành lập',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'TP.HCM' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '0909123456' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    example: '12345678',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    enum: RoleEnum,
    example: RoleEnum.USER,
  })
  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;
}
