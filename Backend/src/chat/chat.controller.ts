import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

// Sem @Roles — tutor e petsitter acessam o mesmo recurso (a conversa do booking deles).
// A validação de "quem pode ver/enviar" é por dono (tutorId/petsitterId do booking), feita
// no ChatService — não por papel.
@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Listar todas as conversas do usuário logado (inbox)' })
  getConversations(@CurrentUser() user: { id: string }) {
    return this.chatService.getConversations(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Contagem agregada de mensagens não lidas (badge)' })
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.chatService.getUnreadCount(user.id);
  }

  @Get(':bookingId/messages')
  @ApiOperation({ summary: 'Histórico de mensagens de uma conversa (?after= pro polling incremental)' })
  listMessages(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Query('after') after?: string,
  ) {
    return this.chatService.listMessages(bookingId, user.id, after);
  }

  @Post(':bookingId/messages')
  @ApiOperation({ summary: 'Enviar mensagem (só permitido com a conversa aberta)' })
  sendMessage(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.sendMessage(bookingId, user.id, dto);
  }

  @Patch(':bookingId/read')
  @ApiOperation({ summary: 'Marcar como lidas as mensagens do outro participante' })
  markRead(@Param('bookingId') bookingId: string, @CurrentUser() user: { id: string }) {
    return this.chatService.markRead(bookingId, user.id);
  }
}
