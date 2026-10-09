import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsOptional()
  @IsString()
  plate?: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  plate?: string;
}

export class VehicleResponseDto {
  id: string;
  brand: string;
  model: string;
  year?: number;
  color: string;
  plate?: string;
}
