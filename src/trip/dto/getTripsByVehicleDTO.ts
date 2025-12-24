import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class GetTripsByVehicleDTO {
  @ApiPropertyOptional({ description: 'vehicleId' })
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
