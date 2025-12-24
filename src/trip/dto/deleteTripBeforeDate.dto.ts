import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class DeleteTripBeforeDate {
  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional()
  date?: string;
}
