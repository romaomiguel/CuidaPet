import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerType } from '@prisma/client';

export class CreatePartnerDto {
  @ApiProperty({ description: 'Nome do responsável/contato' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'E-mail de login do parceiro' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Senha inicial (o parceiro pode trocar depois pelo fluxo normal de login)' })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  })
  password: string;

  @ApiProperty({ enum: PartnerType, description: 'Tipo de parceiro' })
  @IsEnum(PartnerType)
  @IsNotEmpty()
  type: PartnerType;

  @ApiProperty({ description: 'Nome fantasia / razão social' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiPropertyOptional({ description: 'CNPJ (Formato: XX.XXX.XXX/XXXX-XX)' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'O CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX',
  })
  cnpj?: string;

  @ApiProperty({ description: 'Endereço completo' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Cidade' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Estado (UF)' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({ type: String, isArray: true, description: 'Serviços prestados (slugs do catálogo)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  servicesOffered?: string[];
}
