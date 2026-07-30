import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MaxLength,
  IsUrl,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PetSpecies } from '@prisma/client';

export class CreatePetDto {
  @ApiProperty({ description: 'Nome do pet' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: PetSpecies, description: 'Espécie do pet' })
  @IsEnum(PetSpecies)
  @IsNotEmpty()
  species: PetSpecies;

  @ApiPropertyOptional({ description: 'Raça do pet' })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiProperty({ description: 'Idade do pet' })
  @IsNumber()
  @Min(0, { message: 'A idade não pode ser negativa' })
  @Max(50, { message: 'A idade informada é inválida' })
  age: number;

  @ApiPropertyOptional({ description: 'Peso do pet' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'O peso não pode ser negativo' })
  weight?: number;

  @ApiPropertyOptional({ description: 'Observações adicionais' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'As observações não podem ter mais de 500 caracteres' })
  notes?: string;

  @ApiPropertyOptional({ enum: ['baixo', 'medio', 'alto'], description: 'Nível de energia do pet' })
  @IsOptional()
  @IsIn(['baixo', 'medio', 'alto'])
  energyLevel?: string;

  @ApiPropertyOptional({ enum: ['exclusivo', 'sociavel'], description: 'Nível de sociabilidade do pet' })
  @IsOptional()
  @IsIn(['exclusivo', 'sociavel'])
  socialLevel?: string;

  @ApiPropertyOptional({ description: 'Restrições médicas ou alimentares do pet' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'As restrições médicas não podem ter mais de 500 caracteres' })
  medicalRestrictions?: string;

  @ApiPropertyOptional({ description: 'Instruções de alimentação do pet' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'As instruções de alimentação não podem ter mais de 500 caracteres' })
  feedingInstructions?: string;

  @ApiPropertyOptional({ description: 'URL da foto' })
  @IsOptional()
  @IsUrl({}, { message: 'A foto deve ser uma URL válida' })
  photo?: string;
}
