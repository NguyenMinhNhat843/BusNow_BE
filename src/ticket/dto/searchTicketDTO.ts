import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class searchTicketDTO {
  @IsUUID()
  @ApiPropertyOptional()
  @IsOptional()
  ticketId?: string;

  @IsInt()
  @ApiPropertyOptional()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @ApiPropertyOptional()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
