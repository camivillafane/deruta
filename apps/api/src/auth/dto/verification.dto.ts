import { IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @Length(6, 6)
  code: string;
}

export class ResendCodeDto {
  @IsString()
  type: 'email' | 'phone';
}

export class VerifyIdentityDto {
  @IsString()
  @Length(7, 8)
  dni: string;

  @IsString()
  @Length(5, 20)
  licenseNumber: string;

  @IsString()
  licenseFrontImage: string;

  @IsString()
  licenseBackImage: string;
}
