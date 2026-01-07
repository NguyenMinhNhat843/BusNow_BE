import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { BusCompanyRequestStatus } from '../type';

export class UpdateBusCompanyRequestDTO {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @ApiProperty({ enum: BusCompanyRequestStatus })
  @IsEnum(BusCompanyRequestStatus)
  status: BusCompanyRequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectReason?: string;
}
