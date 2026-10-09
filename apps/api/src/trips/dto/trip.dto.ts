import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsDateString()
  departureDate: string;

  @IsString()
  @IsNotEmpty()
  departureTime: string;

  @IsOptional()
  @IsString()
  meetingPoint?: string;

  @IsInt()
  @Min(1)
  availableSeats: number;

  @IsNumber()
  @Min(0)
  contributionPerPassenger: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  vehicleId: string;
}

export class SearchTripsDto {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsDateString()
  departureDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  passengers?: number;
}

export class UpdateTripDto {
  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @IsOptional()
  @IsString()
  departureTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  availableSeats?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  contributionPerPassenger?: number;

  @IsOptional()
  @IsString()
  meetingPoint?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
