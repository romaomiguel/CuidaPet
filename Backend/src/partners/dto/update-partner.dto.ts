import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';

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

  @ApiPropertyOptional({ enum: ServiceType, isArray: true, description: 'Serviços prestados' })
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  servicesOffered?: ServiceType[];
}
