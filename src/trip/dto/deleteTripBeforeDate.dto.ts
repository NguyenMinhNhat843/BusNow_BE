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
  date?: string;
}
