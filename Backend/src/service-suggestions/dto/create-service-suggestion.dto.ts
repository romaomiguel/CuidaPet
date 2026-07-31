import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceSuggestionDto {
  @ApiProperty({ description: 'Descrição livre do serviço sugerido' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'A descrição deve ter no máximo 500 caracteres' })
  description: string;
}
