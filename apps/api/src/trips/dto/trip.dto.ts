import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsFutureDateString, IsTimeString } from '../../common/validators/date.validators.js';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsDateString()
  @IsFutureDateString()
  departureDate: string;

  @IsString()
  @IsNotEmpty()
  @IsTimeString()
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
  @IsFutureDateString()
  departureDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  passengers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}

export class ListTripsQueryDto {
  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsDateString()
  @IsFutureDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}

export class UpdateTripDto {
  @IsOptional()
  @IsDateString()
  @IsFutureDateString()
  departureDate?: string;

  @IsOptional()
  @IsString()
  @IsTimeString()
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
