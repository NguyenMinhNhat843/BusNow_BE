import { IsDateString, IsNumber, IsString } from 'class-validator';

export class createTripDTO {
  @IsNumber()
  price: number;

  @IsDateString()
  departTime: Date;

  @IsDateString()
  arriveTime: Date;

  @IsString()
  fromLocationId: string;

  @IsString()
  toLocationId: string;

  @IsString()
  vehicleId: string;
}
