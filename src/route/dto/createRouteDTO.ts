import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

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
