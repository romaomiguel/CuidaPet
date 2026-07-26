import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SupportMessagesService } from './support-messages.service';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { UpdateSupportMessageDto } from './dto/update-support-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('support-messages')
@Controller('support-messages')
export class SupportMessagesController {
  constructor(private readonly supportMessagesService: SupportMessagesService) {}

  @Post()
  // Público, sem login — o formulário de "Falar com o suporte" pede nome/e-mail porque
  // não presume usuário autenticado. Throttle mais restrito que o global (100/min) contra spam,
  // mesmo padrão do upload de avatar.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Envia uma mensagem para o suporte' })
  create(@Body() dto: CreateSupportMessageDto) {
    return this.supportMessagesService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Lista as mensagens de suporte recebidas' })
  findAll() {
    return this.supportMessagesService.findAll();
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Marca uma mensagem como resolvida ou reabre' })
  setResolved(@Param('id') id: string, @Body() dto: UpdateSupportMessageDto) {
    return this.supportMessagesService.setResolved(id, dto.resolved);
  }
}
