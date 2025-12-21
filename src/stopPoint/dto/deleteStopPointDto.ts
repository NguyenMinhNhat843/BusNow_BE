import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DeleteStopPointDto {
  @ApiProperty()
  @IsUUID()
  stopPointId: string;
}
