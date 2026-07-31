import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome completo do usuário' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Endereço de e-mail do usuário' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Senha do usuário (mínimo 8 caracteres, letras e números)' })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  })
  password: string;

  @ApiPropertyOptional({ description: 'Número de telefone do usuário' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'CPF do usuário (Formato: XXX.XXX.XXX-XX)' })
  // `@IsOptional()` só pula a validação para `undefined`/`null` — string vazia ainda
  // cai no `@Matches` e falha. O front pode mandar '' (ex.: campo limpo no formulário),
  // então normaliza pra `undefined` antes das validações rodarem.
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'O CPF deve estar no formato XXX.XXX.XXX-XX',
  })
  cpf?: string;

  @ApiProperty({
    enum: [Role.tutor, Role.petsitter],
    description: 'Papel do usuário (tutor ou petsitter)',
  })
  @IsIn([Role.tutor, Role.petsitter], { message: 'Papel inválido para cadastro público.' })
  @IsNotEmpty()
  role: Role;

  @ApiPropertyOptional({ description: 'Breve descrição sobre o usuário e/ou seus pets' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'A bio deve ter no máximo 500 caracteres' })
  bio?: string;
}
