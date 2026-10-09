import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { TripRequestStatus } from '../../entities/index.js';

export class CreateTripRequestDto {
  @IsUUID()
  tripId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateTripRequestStatusDto {
  @IsEnum(TripRequestStatus)
  status: TripRequestStatus;
}
