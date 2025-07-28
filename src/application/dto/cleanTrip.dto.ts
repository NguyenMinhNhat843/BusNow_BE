import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CleanTripDTO {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsDateString()
  date: string;
}
