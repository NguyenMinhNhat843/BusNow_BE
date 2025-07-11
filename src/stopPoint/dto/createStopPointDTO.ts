import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { StopPointEnum } from 'src/enum/StopPointsEnum';

export class CreateStopPointDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsUUID()
  cityId: string;
}
