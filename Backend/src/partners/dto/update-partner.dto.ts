import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePartnerDto {
  @ApiPropertyOptional({ description: 'Nome fantasia / razão social' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  businessName?: string;

  @ApiPropertyOptional({ description: 'Endereço completo' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado (UF)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  state?: string;

  @ApiPropertyOptional({ type: String, isArray: true, description: 'Serviços prestados (slugs do catálogo)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  servicesOffered?: string[];
}
