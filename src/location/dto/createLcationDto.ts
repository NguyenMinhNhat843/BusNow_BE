import { CreateStopPointDto } from '@/stopPoint/dto/createStopPointDTO';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class createLocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  locationName: string;

  @ApiProperty({
    type: () => [CreateStopPointDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStopPointDto)
  stopPoints: CreateStopPointDto[];
}
