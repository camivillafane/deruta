import { IsString, Length, Matches } from 'class-validator';
import { IDENTITY_DOCUMENT_KEY } from '../../common/services/identity-documents.service.js';

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
  @Matches(/^\d{7,8}$/, { message: 'El DNI tiene que tener 7 u 8 números, sin puntos' })
  dni: string;

  @IsString()
  @Length(5, 20)
  licenseNumber: string;

  // Clave devuelta por POST /auth/identity-documents (ya no se aceptan URLs externas).
  @IsString()
  @Matches(IDENTITY_DOCUMENT_KEY, { message: 'Subí la foto del frente de la licencia' })
  licenseFrontImage: string;

  @IsString()
  @Matches(IDENTITY_DOCUMENT_KEY, { message: 'Subí la foto del dorso de la licencia' })
  licenseBackImage: string;
}
