import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ServiceType, PetSpecies } from '@prisma/client';

export class MatchPetsittersDto {
  @ApiProperty({ enum: ServiceType, description: 'Tipo de serviço desejado' })
  @IsEnum(ServiceType)
  @IsNotEmpty()
  service: ServiceType;

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
}
