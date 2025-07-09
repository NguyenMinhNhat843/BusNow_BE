import { IsNumber, IsString } from 'class-validator';

export class CreateRouteDTO {
  @IsString()
  originId: string; // locationId

  @IsString()
  destinationId: string; // locationId

  @IsNumber()
  duration: number;

  @IsNumber()
  restAtDestination: number;

  @IsNumber()
  repeatsDay: number;

  @IsString()
  providerId: string; // userId
}
