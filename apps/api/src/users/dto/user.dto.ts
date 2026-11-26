import { IsOptional, IsString } from 'class-validator';
import { IsArgentinePhone } from '../../common/validators/phone.validators.js';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @IsArgentinePhone()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
