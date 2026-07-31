import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceSuggestionDto } from './dto/create-service-suggestion.dto';

@Injectable()
export class ServiceSuggestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateServiceSuggestionDto) {
    return this.prisma.serviceSuggestion.create({
      data: { userId, description: dto.description },
    });
  }

  async findAll(filters: { status?: string; page?: number; limit?: number } = {}) {
    const { status, page = 1, limit = 20 } = filters;

    const where: { status?: string } = {};
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.serviceSuggestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
      this.prisma.serviceSuggestion.count({ where }),
    ]);

    return { data, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  async markReviewed(id: string) {
    const existing = await this.prisma.serviceSuggestion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Sugestão não encontrada.');
    }

    return this.prisma.serviceSuggestion.update({
      where: { id },
      data: { status: 'reviewed' },
    });
  }
}
