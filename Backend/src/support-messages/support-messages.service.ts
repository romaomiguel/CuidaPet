import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';

@Injectable()
export class SupportMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupportMessageDto) {
    const message = await this.prisma.supportMessage.create({ data: dto });

    // TODO: plugar envio de e-mail aqui quando o serviço de e-mail estiver configurado.
    // Por enquanto a mensagem só é persistida — nada se perde enquanto o e-mail não existe.

    return message;
  }

  findAll() {
    return this.prisma.supportMessage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async setResolved(id: string, resolved: boolean) {
    const message = await this.prisma.supportMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Mensagem de suporte não encontrada.');

    return this.prisma.supportMessage.update({ where: { id }, data: { resolved } });
  }
}
