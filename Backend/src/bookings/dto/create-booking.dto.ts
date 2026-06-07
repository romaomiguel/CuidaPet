import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';

export class CreateBookingDto {
  @ApiProperty({ description: 'ID do petsitter' })
  @IsString()
  @IsNotEmpty()
  petsitterId: string;

  @ApiProperty({ description: 'IDs dos pets', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  petIds: string[];

  @ApiProperty({ enum: ServiceType, description: 'Tipo de serviço' })
  @IsEnum(ServiceType)
  @IsNotEmpty()
  service: ServiceType;

  @ApiProperty({ description: 'Data/hora de início (ISO-8601)' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Data/hora de término (ISO-8601)' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}
