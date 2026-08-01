import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PetSpecies } from '@prisma/client';

export class MatchPetsittersDto {
  @ApiProperty({ type: String, description: 'Slug do serviço desejado (catálogo)' })
  @IsString()
  @IsNotEmpty()
  service: string;

  @ApiProperty({ enum: PetSpecies, description: 'Espécie do pet' })
  @IsEnum(PetSpecies)
  @IsNotEmpty()
  species: PetSpecies;

  @ApiProperty({ description: 'Cidade do tutor' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ description: 'Bairro do tutor (texto livre, usado no score de proximidade)' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'Data do serviço no formato YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Horário de início no formato HH:MM (serviços por hora)' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Horário de fim no formato HH:MM (serviços por hora)' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Data de saída no formato YYYY-MM-DD (hospedagem/creche)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Orçamento máximo (por hora ou por diária, conforme o serviço)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['baixo', 'medio', 'alto'], description: 'Nível de energia do pet do tutor — usado na pontuação de compatibilidade' })
  @IsOptional()
  @IsIn(['baixo', 'medio', 'alto'])
  petEnergyLevel?: string;

  @ApiPropertyOptional({ enum: ['exclusivo', 'sociavel'], description: 'Nível de sociabilidade do pet do tutor — usado na pontuação de compatibilidade' })
  @IsOptional()
  @IsIn(['exclusivo', 'sociavel'])
  petSocialLevel?: string;

  @ApiPropertyOptional({ description: 'Tutor precisa de ambiente com ar-condicionado' })
  @IsOptional()
  needsAirConditioning?: boolean;

  @ApiPropertyOptional({ description: 'Tutor precisa de ambiente com quintal' })
  @IsOptional()
  needsBackyard?: boolean;

  @ApiPropertyOptional({ enum: ['manha', 'noite'], description: 'Horário de passeio preferido pelo tutor' })
  @IsOptional()
  @IsIn(['manha', 'noite'])
  preferredWalkSchedule?: string;

  @ApiPropertyOptional({ enum: ['casa', 'apartamento'], description: 'Tipo de imóvel preferido pelo tutor' })
  @IsOptional()
  @IsIn(['casa', 'apartamento'])
  preferredHomeType?: string;
}
