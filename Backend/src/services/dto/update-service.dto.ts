import { IsString, IsNotEmpty, IsIn, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SERVICE_AUDIENCES, ServiceAudience } from './create-service.dto';

export class UpdateServiceDto {
  @ApiPropertyOptional({ description: 'Nome de exibição do serviço' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60, { message: 'O nome deve ter no máximo 60 caracteres' })
  name?: string;

  @ApiPropertyOptional({ description: 'Emoji do serviço' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(8, { message: 'O emoji deve ter no máximo 8 caracteres' })
  emoji?: string;

  @ApiPropertyOptional({ description: 'Descrição básica do serviço' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300, { message: 'A descrição deve ter no máximo 300 caracteres' })
  description?: string;

  @ApiPropertyOptional({ enum: SERVICE_AUDIENCES, description: 'Quem presta esse serviço' })
  @IsOptional()
  @IsIn(SERVICE_AUDIENCES, { message: `audience deve ser um de: ${SERVICE_AUDIENCES.join(', ')}` })
  audience?: ServiceAudience;

  @ApiPropertyOptional({ description: 'Ativo (aparece nos seletores) ou aposentado' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
