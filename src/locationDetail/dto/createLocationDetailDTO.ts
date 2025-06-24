import { IsOptional, IsString } from 'class-validator';

export class CreateLocationDetailDTO {
  @IsString()
  name: string;

  @IsString()
  locationId: string;
}
