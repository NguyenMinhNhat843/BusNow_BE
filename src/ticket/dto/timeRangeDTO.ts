import { Type } from 'class-transformer';
import { IsDate, IsDateString, IsOptional } from 'class-validator';

export class TimeRangeDTO {
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startTime?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endTime?: Date;
}
