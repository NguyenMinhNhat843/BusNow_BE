import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsString } from 'class-validator';

export class GenTripDTO {
  @IsString()
  @ApiProperty()
  vehicleId: string;

  @IsDateString()
  @ApiPropertyOptional()
  startTime?: Date;

  @IsDateString()
  @ApiProperty()
  endTime: Date;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty()
  price: number;
}
