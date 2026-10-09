import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAlertDto {
  @IsString()
  origin: string;

  @IsString()
  destination: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  preferredTime?: string;
}
