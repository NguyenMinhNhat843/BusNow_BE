import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class SendTicketEmailDTO {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  busName: string;

  @IsString()
  @IsNotEmpty()
  busCode: string;

  @IsDateString()
  @IsNotEmpty()
  departDate: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  seatCode: number;

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;
}
