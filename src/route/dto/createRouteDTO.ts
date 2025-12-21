import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateRouteDTO {
  @ApiProperty()
  @IsString()
  originId: string; // locationId

  @ApiProperty()
  @IsString()
  destinationId: string; // locationId

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty()
  @IsNumber()
  restAtDestination: number;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  providerId?: string; // userId

  @ApiProperty()
  @IsArray()
  stopPointIds: string[];
}
