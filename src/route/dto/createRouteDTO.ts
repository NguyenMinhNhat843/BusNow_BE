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
  @IsString()
  originId: string; // locationId

  @IsString()
  destinationId: string; // locationId

  @IsNumber()
  duration: number;

  @IsNumber()
  restAtDestination: number;

  @IsString()
  @IsOptional()
  providerId?: string; // userId

  @IsArray()
  stopPointIds: string[];
}
