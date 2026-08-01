import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  IsIn,
  Min,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PetSpecies } from '@prisma/client';

export class CreatePetsitterProfileDto {
  @ApiProperty({ description: 'Biografia do petsitter' })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'A biografia não pode ter mais de 1000 caracteres' })
  bio: string;

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Serviços oferecidos (slugs do catálogo)',
  })
  @IsArray()
  @IsString({ each: true })
  services: string[];

  @ApiProperty({ description: 'Preço por hora' })
  @IsNumber()
  @Min(0, { message: 'O preço por hora não pode ser negativo' })
  pricePerHour: number;

  @ApiProperty({ description: 'Endereço completo' })
  @IsString()
  @IsOptional()
  location: string;

  @ApiProperty({ description: 'Cidade de atuação' })
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({ description: 'Estado de atuação' })
  @IsString()
  @IsOptional()
  state: string;

  @ApiPropertyOptional({ description: 'Indica se o petsitter está disponível' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Indica se o petsitter compartilha localização (check-in manual) durante os serviços' })
  @IsOptional()
  @IsBoolean()
  offersLocationSharing?: boolean;

  @ApiPropertyOptional({
    description: 'Configuração de agenda por dia: { "Segunda": { "enabled": true, "start": "08:00", "end": "17:00" } }',
  })
  @IsOptional()
  @IsObject()
  scheduleConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Configuração de preço por serviço' })
  @IsOptional()
  @IsObject()
  pricingConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Capacidade de pets simultâneos por dia' })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'A capacidade por dia deve ser de pelo menos 1' })
  capacityPerDay?: number;

  @ApiPropertyOptional({ description: 'Fotos do local/serviço' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'As fotos devem ser URLs válidas' })
  photos?: string[];

  @ApiProperty({
    enum: PetSpecies,
    isArray: true,
    description: 'Espécies de pets aceitas pelo petsitter',
  })
  @IsArray()
  @IsEnum(PetSpecies, { each: true })
  @IsOptional()
  acceptedSpecies?: PetSpecies[];

  @ApiPropertyOptional({ description: 'Indica se o ambiente do petsitter tem ar-condicionado' })
  @IsOptional()
  @IsBoolean()
  hasAirConditioning?: boolean;

  @ApiPropertyOptional({ enum: ['casa', 'apartamento'], description: 'Tipo de imóvel onde o petsitter atende' })
  @IsOptional()
  @IsIn(['casa', 'apartamento'])
  homeType?: string;

  @ApiPropertyOptional({ description: 'Indica se o petsitter tem quintal' })
  @IsOptional()
  @IsBoolean()
  hasBackyard?: boolean;

  @ApiPropertyOptional({ enum: ['manha', 'noite'], description: 'Horário preferido do petsitter para passeios' })
  @IsOptional()
  @IsIn(['manha', 'noite'])
  walkSchedule?: string;
}
