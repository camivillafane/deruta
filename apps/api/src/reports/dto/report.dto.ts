import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsUUID()
  reportedUserId: string;

  @IsString()
  @MinLength(3)
  reason: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ResolveReportDto {
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
