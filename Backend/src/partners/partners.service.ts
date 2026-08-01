import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PartnerType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService, AVATAR_SIGNED_URL_TTL_SECONDS } from '../storage/storage.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { ServicesService } from '../services/services.service';

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly servicesService: ServicesService,
  ) {}

  /** Assina paths de `photos` em lote — mesma ideia de withAvatarUrl, mas pro array de galeria.
   * Fotos cujo path não resolver somem do array em vez de quebrar a resposta. */
  private async withPhotoUrls<T extends { photos: string[] }>(profile: T): Promise<T> {
    if (profile.photos.length === 0) return profile;
    const urlMap = await this.storageService.createAvatarUrls(profile.photos, AVATAR_SIGNED_URL_TTL_SECONDS);
    return { ...profile, photos: profile.photos.map((p) => urlMap.get(p)).filter((u): u is string => !!u) };
  }

  /** Mesmo padrão de `withAvatarUrl` em `petsitters.service.ts` — mantém `avatar` (path cru) no
   * objeto e adiciona `avatarUrl` ao lado, o frontend só consome o segundo. */
  private async withAvatarUrl<T extends { user: { avatar: string | null } }>(
    profile: T,
  ): Promise<T & { user: T['user'] & { avatarUrl: string | null } }> {
    const avatarUrl = await this.storageService.createAvatarUrl(profile.user.avatar, AVATAR_SIGNED_URL_TTL_SECONDS);
    return { ...profile, user: { ...profile.user, avatarUrl } };
  }

  async create(dto: CreatePartnerDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('E-mail já está em uso.');
    }

    await this.servicesService.assertValidSlugs(dto.servicesOffered ?? [], dto.type);

    if (dto.cnpj) {
      const existingCnpj = await this.prisma.partnerProfile.findUnique({ where: { cnpj: dto.cnpj } });
      if (existingCnpj) {
        throw new ConflictException('CNPJ já está em uso.');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        // O nome de exibição em toda a plataforma (Navbar, Sidebar, página pública) é o
        // nome fantasia, não o nome do contato — dto.name vira só contactName, informativo.
        name: dto.businessName,
        email: dto.email,
        password: hashedPassword,
        role: 'partner',
        partnerProfile: {
          create: {
            type: dto.type,
            businessName: dto.businessName,
            contactName: dto.name,
            cnpj: dto.cnpj,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            servicesOffered: dto.servicesOffered ?? [],
          },
        },
      },
      select: {
        id: true,
      },
    });

    return this.findByUserId(user.id);
  }

  async findAllForAdmin(
    filters: { type?: PartnerType; city?: string; page?: number; limit?: number } = {},
  ) {
    const { type, city, page = 1, limit = 20 } = filters;

    const where: { type?: PartnerType; city?: { contains: string; mode: 'insensitive' } } = {};
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.partnerProfile.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { name: true, email: true, isActive: true } } },
      }),
      this.prisma.partnerProfile.count({ where }),
    ]);

    return { data, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, isActive: true } } },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de parceiro não encontrado.');
    }

    return this.withPhotoUrls(profile);
  }

  async update(userId: string, dto: UpdatePartnerDto) {
    if (dto.servicesOffered) {
      const existing = await this.prisma.partnerProfile.findUnique({ where: { userId }, select: { type: true } });
      if (!existing) {
        throw new NotFoundException('Perfil de parceiro não encontrado.');
      }
      await this.servicesService.assertValidSlugs(dto.servicesOffered, existing.type);
    }

    const updated = await this.prisma.partnerProfile.update({
      where: { userId },
      data: {
        businessName: dto.businessName,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        servicesOffered: dto.servicesOffered,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isActive: true,
          },
        },
      },
    });
    return this.withPhotoUrls(updated);
  }

  private static readonly MAX_PHOTOS = 8;

  /** `path` já é o path real gravado no Storage pelo controller — devolve o array atualizado
   * já como signed URLs. */
  async addPhoto(userId: string, path: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: { photos: true },
    });
    if (!profile) {
      throw new NotFoundException('Perfil de parceiro não encontrado.');
    }
    if (profile.photos.length >= PartnersService.MAX_PHOTOS) {
      throw new BadRequestException(
        `Limite de ${PartnersService.MAX_PHOTOS} fotos atingido. Remova uma foto antes de adicionar outra.`,
      );
    }

    const updated = await this.prisma.partnerProfile.update({
      where: { userId },
      data: { photos: [...profile.photos, path] },
      select: { photos: true },
    });
    return this.withPhotoUrls(updated);
  }

  /** `index` é a posição no array — único identificador estável que o frontend tem, já que ele
   * só vê signed URLs. Resolve o path real internamente, apaga do Storage, só então atualiza o
   * array — devolve o array atualizado já como signed URLs. */
  async removePhoto(userId: string, index: number) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: { photos: true },
    });
    if (!profile) {
      throw new NotFoundException('Perfil de parceiro não encontrado.');
    }
    if (index < 0 || index >= profile.photos.length) {
      throw new BadRequestException('Índice de foto inválido.');
    }

    const pathToRemove = profile.photos[index];
    await this.storageService.deleteObject(pathToRemove);

    const updated = await this.prisma.partnerProfile.update({
      where: { userId },
      data: { photos: profile.photos.filter((_, i) => i !== index) },
      select: { photos: true },
    });
    return this.withPhotoUrls(updated);
  }

  /**
   * Shape PÚBLICO — rota sem guard, acessível por qualquer request anônimo. Nunca inclui
   * email/cnpj/contactName/isActive, só o necessário pra exibição de uma página de parceiro.
   */
  async findOne(id: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        businessName: true,
        address: true,
        city: true,
        state: true,
        servicesOffered: true,
        photos: true,
        user: { select: { name: true, avatar: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException('Parceiro não encontrado.');
    }

    return this.withPhotoUrls(await this.withAvatarUrl(profile));
  }

  /**
   * Listagem PÚBLICA — mesmo shape público-seguro de `findOne`, só que paginada e
   * filtrável. Exclui parceiros suspensos (`user.isActive = false`) — diferente de
   * `findOne`, que não filtra isso (padrão pré-existente); esta é a primeira rota de
   * listagem de fato alcançável por busca, então fecha essa lacuna aqui.
   */
  async findAll(
    filters: { type?: PartnerType; service?: string; city?: string; page?: number; limit?: number } = {},
  ) {
    const { type, service, city, page = 1, limit = 20 } = filters;

    const where: {
      user: { isActive: true };
      type?: PartnerType;
      servicesOffered?: { has: string };
      city?: { contains: string; mode: 'insensitive' };
    } = { user: { isActive: true } };
    if (type) where.type = type;
    if (service) where.servicesOffered = { has: service };
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.partnerProfile.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          businessName: true,
          address: true,
          city: true,
          state: true,
          servicesOffered: true,
          photos: true,
          user: { select: { name: true, avatar: true } },
        },
      }),
      this.prisma.partnerProfile.count({ where }),
    ]);

    // withAvatarUrl é async — resolver por linha antes de withPhotoUrls:
    const resolved = await Promise.all(rows.map(async (r) => this.withPhotoUrls(await this.withAvatarUrl(r))));

    return { data: resolved, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }
}
