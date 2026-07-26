import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupportMessageDto {
  @ApiProperty({ description: 'Nome de quem está enviando a mensagem' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'E-mail para retorno' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Telefone ou outro contato (opcional)' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiProperty({ description: 'Pergunta ou mensagem enviada ao suporte' })
  @IsString()
  @MinLength(5)
  question: string;
}
