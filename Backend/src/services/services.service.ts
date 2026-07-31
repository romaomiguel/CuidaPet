import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Remove acentos, minúsculas, troca não-alfanumérico por "_", sem "_" nas pontas. */
  private slugify(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async create(dto: CreateServiceDto) {
    const baseSlug = this.slugify(dto.name);
    let slug = baseSlug;
    let suffix = 2;
    while (await this.prisma.service.findUnique({ where: { slug } })) {
      slug = `${baseSlug}_${suffix}`;
      suffix++;
    }

    return this.prisma.service.create({
      data: { slug, name: dto.name, emoji: dto.emoji, description: dto.description, audience: dto.audience },
    });
  }

  async findAll(filters: { audience?: string; isActive?: boolean } = {}) {
    const where: { audience?: string; isActive?: boolean } = {};
    if (filters.audience) where.audience = filters.audience;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.service.findMany({ where, orderBy: { name: 'asc' } });
  }

  async update(id: string, dto: UpdateServiceDto) {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Serviço não encontrado.');
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        name: dto.name,
        emoji: dto.emoji,
        description: dto.description,
        audience: dto.audience,
        isActive: dto.isActive,
      },
    });
  }

  /**
   * Lança BadRequestException se algum slug não corresponder a um Service ATIVO da
   * audience certa. Chamado pelos módulos de Petsitter/Partner/Match antes de gravar
   * uma lista de serviços — substitui a validação que o enum do Postgres fazia sozinho.
   */
  async assertValidSlugs(slugs: string[], audience: string): Promise<void> {
    if (slugs.length === 0) return;

    const found = await this.prisma.service.findMany({
      where: { slug: { in: slugs }, audience, isActive: true },
      select: { slug: true },
    });
    const foundSlugs = new Set(found.map((s) => s.slug));
    const invalid = slugs.filter((s) => !foundSlugs.has(s));

    if (invalid.length > 0) {
      throw new BadRequestException(
        `Serviço(s) inválido(s) ou inativo(s) para este tipo: ${invalid.join(', ')}`,
      );
    }
  }
}
