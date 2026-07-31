import { IsString, IsNotEmpty, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const SERVICE_AUDIENCES = ['petsitter', 'clinica', 'petshop'] as const;
export type ServiceAudience = (typeof SERVICE_AUDIENCES)[number];

export class CreateServiceDto {
  @ApiProperty({ description: 'Nome de exibição do serviço' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60, { message: 'O nome deve ter no máximo 60 caracteres' })
  name: string;

  @ApiProperty({ description: 'Emoji do serviço' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8, { message: 'O emoji deve ter no máximo 8 caracteres' })
  emoji: string;

  @ApiProperty({ description: 'Descrição básica do serviço' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300, { message: 'A descrição deve ter no máximo 300 caracteres' })
  description: string;

  @ApiProperty({ enum: SERVICE_AUDIENCES, description: 'Quem presta esse serviço' })
  @IsIn(SERVICE_AUDIENCES, { message: `audience deve ser um de: ${SERVICE_AUDIENCES.join(', ')}` })
  audience: ServiceAudience;
}
