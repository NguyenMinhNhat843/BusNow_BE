import { IsUUID } from 'class-validator';

export class deleteLocationDto {
  @IsUUID()
  locationId: string;
}
