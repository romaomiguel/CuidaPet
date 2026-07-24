import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Booking } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService, AVATAR_SIGNED_URL_TTL_SECONDS } from '../storage/storage.service';
import { CreateMessageDto } from './dto/create-message.dto';

const CHAT_CLOSE_WINDOW_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /** A conversa existe ⟺ acceptedAt não é nulo — sobrevive a um cancelamento posterior
   * (histórico permanece visível mesmo depois que o booking sai de "accepted"). */
  private async findBookingForParticipant(bookingId: string, userId: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Agendamento não encontrado.');

    if (booking.tutorId !== userId && booking.petsitterId !== userId) {
      throw new ForbiddenException('Você não tem acesso a esta conversa.');
    }

    if (!booking.acceptedAt) {
      throw new NotFoundException('Esta conversa ainda não foi aberta.');
    }

    return booking;
  }

  /** Só controla o ENVIO — leitura do histórico nunca é bloqueada por isto. */
  private canSend(booking: Booking): boolean {
    if (booking.status === 'accepted') return true;
    if (booking.status === 'completed' && booking.completedAt) {
      return Date.now() - booking.completedAt.getTime() < CHAT_CLOSE_WINDOW_MS;
    }
    return false;
  }

  /** Chamado internamente pelo BookingsService quando o petsitter aceita — nunca exposto
   * via endpoint HTTP. senderId null = mensagem de sistema, nunca vem de input do cliente. */
  async createSystemMessage(bookingId: string, content: string) {
    return this.prisma.chatMessage.create({
      data: { bookingId, senderId: null, content },
    });
  }

  async listMessages(bookingId: string, userId: string, after?: string) {
    await this.findBookingForParticipant(bookingId, userId);

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        bookingId,
        ...(after && { createdAt: { gt: new Date(after) } }),
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      isSystem: m.senderId === null,
      content: m.content,
      createdAt: m.createdAt,
      readAt: m.readAt,
    }));
  }

  // O senderId SEMPRE vem do usuário autenticado (guard + @CurrentUser no controller) —
  // nunca do corpo da requisição. Não há caminho pelo qual um cliente possa criar uma
  // mensagem com senderId null (isso só acontece em createSystemMessage, chamado só
  // internamente pelo backend).
  async sendMessage(bookingId: string, userId: string, dto: CreateMessageDto) {
    const booking = await this.findBookingForParticipant(bookingId, userId);

    if (!this.canSend(booking)) {
      throw new BadRequestException('Esta conversa está encerrada — não é mais possível enviar mensagens.');
    }

    return this.prisma.chatMessage.create({
      data: { bookingId, senderId: userId, content: dto.content },
    });
  }

  async markRead(bookingId: string, userId: string) {
    await this.findBookingForParticipant(bookingId, userId);

    await this.prisma.chatMessage.updateMany({
      // `senderId: { not: userId }` sozinho excluiria as mensagens de sistema (senderId
      // NULL) — em SQL, "NULL <> valor" é desconhecido, nunca verdadeiro. O OR explícito
      // com `senderId: null` garante que mensagem de sistema também vira lida.
      where: { bookingId, readAt: null, OR: [{ senderId: null }, { senderId: { not: userId } }] },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.chatMessage.count({
      where: {
        readAt: null,
        OR: [{ senderId: null }, { senderId: { not: userId } }],
        booking: { OR: [{ tutorId: userId }, { petsitterId: userId }] },
      },
    });
    return { count };
  }

  async getConversations(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        acceptedAt: { not: null },
        OR: [{ tutorId: userId }, { petsitterId: userId }],
      },
      include: {
        tutor: { select: { id: true, name: true, avatar: true } },
        petsitter: { select: { id: true, name: true, avatar: true } },
        chatMessages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (bookings.length === 0) return [];

    const bookingIds = bookings.map((b) => b.id);
    const unreadGroups = await this.prisma.chatMessage.groupBy({
      by: ['bookingId'],
      where: {
        bookingId: { in: bookingIds },
        readAt: null,
        OR: [{ senderId: null }, { senderId: { not: userId } }],
      },
      _count: { _all: true },
    });
    const unreadMap = new Map(unreadGroups.map((g) => [g.bookingId, g._count._all]));

    const otherAvatarPaths = bookings
      .map((b) => (b.tutorId === userId ? b.petsitter.avatar : b.tutor.avatar))
      .filter((p): p is string => Boolean(p));
    const avatarUrlMap = await this.storageService.createAvatarUrls(
      otherAvatarPaths,
      AVATAR_SIGNED_URL_TTL_SECONDS,
    );

    const conversations = bookings.map((b) => {
      const otherUser = b.tutorId === userId ? b.petsitter : b.tutor;
      const lastMessage = b.chatMessages[0] ?? null;
      const updatedAt = lastMessage ? lastMessage.createdAt : b.acceptedAt!;

      return {
        bookingId: b.id,
        service: b.service,
        status: b.status,
        // Só pra o frontend calcular localmente se o chat ainda está na janela de envio
        // (mesma regra de canSend acima) sem precisar de outra chamada — o backend continua
        // sendo a autoridade real, validada de novo em sendMessage.
        completedAt: b.completedAt,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          avatarUrl: otherUser.avatar ? avatarUrlMap.get(otherUser.avatar) ?? null : null,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
              isSystem: lastMessage.senderId === null,
            }
          : null,
        unreadCount: unreadMap.get(b.id) ?? 0,
        updatedAt,
      };
    });

    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return conversations;
  }
}
