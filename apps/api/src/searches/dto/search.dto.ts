import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateTripSearchDto {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  preferredTime?: string;

  @IsOptional()
  @IsBoolean()
  flexibleTime?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  passengers?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
