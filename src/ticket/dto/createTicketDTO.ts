import { IsOptional, IsString } from 'class-validator';

export class CreateTIcketDTO {
  @IsString()
  departLocationId: string;

  @IsString()
  arriveLocationId: string;

  @IsString()
  tripId: string;

  @IsString()
  seatCode: string;

  @IsString()
  @IsOptional()
  typeSeat?: string;
}
