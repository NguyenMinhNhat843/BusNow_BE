import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class DeleteTripDTO {
  @IsString()
  @IsOptional()
  tripId?: string;

  @IsArray()
  @IsOptional()
  tripIds?: string[];

  @IsString()
  @IsOptional()
  beforeDate?: string; // 'YYYY-MM-DD'

  @IsString()
  @IsOptional()
  afterDate?: string; // 'YYYY-MM-DD'

  @IsString()
  @IsOptional()
  fromDate?: string; // 'YYYY-MM-DD'

  @IsString()
  @IsOptional()
  toDate?: string; // 'YYYY-MM-DD'

  @IsBoolean()
  @IsOptional()
  deleteAll?: boolean;
}
