import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService, AVATAR_SIGNED_URL_TTL_SECONDS } from '../storage/storage.service';
import { CreatePetsitterProfileDto } from './dto/create-petsitter-profile.dto';
import { UpdatePetsitterProfileDto } from './dto/update-petsitter-profile.dto';
import { PetsitterStatus } from './dto/update-petsitter-status.dto';
import { MatchPetsittersDto } from './dto/match-petsitters.dto';
import { ServicesService } from '../services/services.service';

@Injectable()
export class PetsittersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly servicesService: ServicesService,
  ) {}

  /** `user.avatar` guarda um path do Storage (não uma URL) — troca por signed URL só na saída. */
  private async withAvatarUrl<T extends { user: { avatar: string | null } }>(
    profile: T,
  ): Promise<T & { user: T['user'] & { avatarUrl: string | null } }> {
    const avatarUrl = await this.storageService.createAvatarUrl(
      profile.user.avatar,
      AVATAR_SIGNED_URL_TTL_SECONDS,
    );
    return { ...profile, user: { ...profile.user, avatarUrl } };
  }

  /** Versão em lote de `withAvatarUrl`, pra listagens — 1 chamada ao Storage em vez de N. */
  private async withAvatarUrls<T extends { user: { avatar: string | null } }>(
    profiles: T[],
  ): Promise<(T & { user: T['user'] & { avatarUrl: string | null } })[]> {
    const paths = profiles.map((p) => p.user.avatar).filter((p): p is string => Boolean(p));
    const urlMap = await this.storageService.createAvatarUrls(paths, AVATAR_SIGNED_URL_TTL_SECONDS);

    return profiles.map((profile) => ({
      ...profile,
      user: { ...profile.user, avatarUrl: profile.user.avatar ? urlMap.get(profile.user.avatar) ?? null : null },
    }));
  }

  /** Assina paths de `photos` em lote — mesma ideia de withAvatarUrl(s), mas pro array de galeria.
   * Fotos cujo path não resolver (removidas do Storage por fora, URL expirada etc.) somem do
   * array em vez de quebrar a resposta. */
  private async withPhotoUrls<T extends { photos: string[] }>(profile: T): Promise<T> {
    if (profile.photos.length === 0) return profile;
    const urlMap = await this.storageService.createAvatarUrls(profile.photos, AVATAR_SIGNED_URL_TTL_SECONDS);
    return { ...profile, photos: profile.photos.map((p) => urlMap.get(p)).filter((u): u is string => !!u) };
  }

  async create(userId: string, createPetsitterProfileDto: CreatePetsitterProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (user.role !== 'petsitter') {
      throw new ConflictException('Usuário não tem o papel de petsitter.');
    }

    const existingProfile = await this.prisma.petsitterProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException(
        'O usuário já possui um perfil de petsitter.',
      );
    }

    await this.servicesService.assertValidSlugs(createPetsitterProfileDto.services ?? [], 'petsitter');

    return this.prisma.petsitterProfile.create({
      data: { ...createPetsitterProfileDto, userId },
    });
  }

  async findAll(filters: { city?: string; service?: string; minRating?: number; maxPrice?: number; page?: number; limit?: number; status?: string } = {}) {
    const { city, service, minRating, maxPrice, page = 1, limit = 20, status } = filters;
    
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    } else if (!status) {
      where.status = 'approved';
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (service) {
      where.services = { has: service };
    }

    if (minRating) {
      where.rating = { gte: minRating };
    }

    if (maxPrice) {
      where.pricePerHour = { lte: maxPrice };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.petsitterProfile.findMany({
        where,
        skip,
        take: limit,
        select: this.publicProfileSelect(),
      }),
      this.prisma.petsitterProfile.count({ where }),
    ]);

    return {
      data: await this.withAvatarUrls(data),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMatches(params: MatchPetsittersDto) {
    const {
      service, species, city, neighborhood, date, startTime, endTime, maxPrice,
      needsAirConditioning, needsBackyard, preferredWalkSchedule, preferredHomeType,
      petEnergyLevel, petSocialLevel,
    } = params;

    await this.servicesService.assertValidSlugs([service], 'petsitter');

    // Serviços que cobram por diária (hospedagem e creche)
    const DAILY_SERVICES = ['hospedagem', 'creche'];
    const isDaily = DAILY_SERVICES.includes(service as string);

    const petsitters = await this.prisma.petsitterProfile.findMany({
      where: {
        status: 'approved',
        services: { has: service },
        acceptedSpecies: { has: species },
      },
      select: this.publicProfileSelect(),
    });

    // Mapa do dia da semana em PT-BR para checar scheduleConfig
    const PT_DAYS: Record<number, string> = {
      0: 'Domingo',
      1: 'Segunda',
      2: 'Terça',
      3: 'Quarta',
      4: 'Quinta',
      5: 'Sexta',
      6: 'Sábado',
    };

    const scoredMatches = petsitters.map((profile) => {
      let score = 0;
      const matchReasons: string[] = [];

      // ── Cidade (30pts) ──────────────────────────────────────────
      const cityMatch =
        profile.city && profile.city.toLowerCase() === city.toLowerCase();
      if (cityMatch) {
        score += 30;
        matchReasons.push(`🏙️ Atende em ${city}`);
      }

      // ── Bairro/Proximidade (15pts) ───────────────────────────────
      const neighborhoodMatch =
        neighborhood &&
        profile.location &&
        profile.location.toLowerCase().includes(neighborhood.toLowerCase());
      if (neighborhoodMatch) {
        score += 15;
        matchReasons.push(`📍 Atende no bairro ${neighborhood}`);
      }

      // ── Disponibilidade no horário (25pts) ───────────────────────
      let availabilityMatch = false;
      if (date && profile.scheduleConfig) {
        try {
          const dateObj = new Date(date + 'T12:00:00'); // noon to avoid timezone issues
          const dayName = PT_DAYS[dateObj.getDay()];
          const config = profile.scheduleConfig as Record<
            string,
            { enabled?: boolean; start?: string; end?: string }
          >;
          const dayConfig = config[dayName];

          if (dayConfig?.enabled) {
            if (!isDaily && startTime && dayConfig.start && dayConfig.end) {
              // Serviços por hora: verifica se o horário está dentro da janela
              const toMinutes = (t: string) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
              };
              const reqStart = toMinutes(startTime);
              const configStart = toMinutes(dayConfig.start);
              const configEnd = toMinutes(dayConfig.end);
              if (reqStart >= configStart && reqStart < configEnd) {
                availabilityMatch = true;
              }
            } else if (isDaily) {
              // Serviços por diária: apenas verifica se o dia está habilitado
              availabilityMatch = true;
            }
          }
        } catch {
          // Se falhar ao parsear, ignora o critério
        }
      } else if (!date) {
        // Se não informou data, não penaliza
        availabilityMatch = true;
      }

      if (availabilityMatch) {
        score += 25;
        if (date) {
          const dateObj = new Date(date + 'T12:00:00');
          const dayName = PT_DAYS[dateObj.getDay()];
          if (!isDaily && startTime) {
            matchReasons.push(`✅ Disponível ${dayName.toLowerCase()} às ${startTime}`);
          } else {
            matchReasons.push(`✅ Disponível na data solicitada`);
          }
        }
      }

      // ── Avaliação (15–25pts) ─────────────────────────────────────
      // Petsitters novos (sem avaliações) recebem 15pts de bônus de confiança.
      // Petsitters avaliados recebem até 25pts proporcionalmente.
      if (profile.rating && profile.totalReviews > 0) {
        const ratingScore = 15 + (profile.rating / 5) * 10;
        score += ratingScore;
        matchReasons.push(
          `⭐ ${profile.rating.toFixed(1)} estrelas · ${profile.totalReviews} avaliações`,
        );
      } else {
        // Novo petsitter: bônus de confiança
        score += 15;
        matchReasons.push(`🆕 Novo na plataforma`);
      }

      // ── Orçamento (10–15pts) ──────────────────────────────────────
      if (maxPrice !== undefined) {
        const pConfig = profile.pricingConfig as Record<
          string,
          { price: number }
        > | null;
        const servicePrice = pConfig?.[service as string]?.price ?? profile.pricePerHour;

        if (servicePrice <= maxPrice) {
          score += 15;
          matchReasons.push(
            `💰 R$${servicePrice}/${isDaily ? 'dia' : 'h'} — dentro do orçamento`,
          );
        }
      } else {
        // Sem limite de orçamento: bônus neutro maior
        score += 10;
      }

      // ── Clima e Infraestrutura (até 20pts) ────────────────────────
      if (needsAirConditioning && profile.hasAirConditioning) {
        score += 5;
        matchReasons.push('❄️ Ambiente com ar-condicionado');
      }
      if (needsBackyard && profile.hasBackyard) {
        score += 5;
        matchReasons.push('🌳 Ambiente com quintal');
      }
      if (preferredWalkSchedule && profile.walkSchedule === preferredWalkSchedule) {
        score += 5;
        matchReasons.push(
          `🕐 Passeios no horário ${preferredWalkSchedule === 'manha' ? 'da manhã' : 'da noite'}`,
        );
      }
      if (preferredHomeType && profile.homeType === preferredHomeType) {
        score += 5;
        matchReasons.push(`🏡 Atende em ${preferredHomeType}`);
      }

      // ── Compatibilidade do Pet (até 10pts) ─────────────────────────
      if (petEnergyLevel === 'alto' && profile.hasBackyard) {
        score += 5;
        matchReasons.push('⚡ Espaço para gastar energia (pet de alta energia)');
      }
      if (petSocialLevel === 'exclusivo' && profile.capacityPerDay === 1) {
        score += 5;
        matchReasons.push('🐾 Cuidador atende um único pet por vez');
      }

      return {
        ...profile,
        matchScore: Math.min(100, Math.round(score)),
        matchReasons,
      };
    });

    const top15 = scoredMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 15); // Máximo 15 resultados

    return this.withAvatarUrls(top15);
  }

  async findOne(id: string) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { id },
      select: this.publicProfileSelect(),
    });

    if (!profile) {
      throw new NotFoundException('Perfil de petsitter não encontrado.');
    }

    return this.withPhotoUrls(await this.withAvatarUrl(profile));
  }

  /**
   * Shape usado nas rotas PÚBLICAS (sem guard): findAll, findOne, findMatches.
   * Exclui identityProof/addressProof (documentos sensíveis) e email/phone do
   * usuário (não usados em nenhuma tela pública hoje) — essas rotas são
   * acessíveis por qualquer request anônimo, então nunca devem devolver dado
   * sensível. Rotas autenticadas (findByUserId/"me") continuam com seu próprio
   * include, sem essa restrição.
   */
  private publicProfileSelect() {
    return {
      id: true,
      userId: true,
      bio: true,
      services: true,
      pricePerHour: true,
      location: true,
      city: true,
      state: true,
      rating: true,
      totalReviews: true,
      scheduleConfig: true,
      isAvailable: true,
      photos: true,
      pricingConfig: true,
      capacityPerDay: true,
      status: true,
      acceptedSpecies: true,
      hasAirConditioning: true,
      homeType: true,
      hasBackyard: true,
      walkSchedule: true,
      user: { select: { name: true, avatar: true } },
    } as const;
  }

  /**
   * Shape usado SÓ pela listagem admin (`GET /petsitters/admin/list`, `@Roles('admin')`).
   * Precisa saber SE existe documento pra mostrar o botão de revisão — mas não expõe o
   * path em si na listagem (só quando o admin clica, via `getDocumentPath` + signed URL).
   * `identityProof`/`addressProof` brutos são lidos aqui só pra computar o booleano, e
   * removidos antes do retorno em `findAllForAdmin` (nunca saem deste service).
   */
  private adminProfileSelect() {
    return {
      id: true,
      userId: true,
      bio: true,
      services: true,
      pricePerHour: true,
      location: true,
      city: true,
      state: true,
      rating: true,
      totalReviews: true,
      isAvailable: true,
      capacityPerDay: true,
      status: true,
      acceptedSpecies: true,
      hasAirConditioning: true,
      homeType: true,
      hasBackyard: true,
      walkSchedule: true,
      identityProof: true,
      addressProof: true,
      user: { select: { name: true, email: true, phone: true, avatar: true } },
    } as const;
  }

  /** Listagem para o painel admin — com indicador de documento, sem reusar a rota pública. */
  async findAllForAdmin(
    filters: { city?: string; status?: string; page?: number; limit?: number } = {},
  ) {
    const { city, status, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.petsitterProfile.findMany({
        where,
        skip,
        take: limit,
        select: this.adminProfileSelect(),
      }),
      this.prisma.petsitterProfile.count({ where }),
    ]);

    const withAvatars = await this.withAvatarUrls(rows);
    const data = withAvatars.map(({ identityProof, addressProof, ...rest }) => ({
      ...rest,
      hasIdentityProof: Boolean(identityProof),
      hasAddressProof: Boolean(addressProof),
    }));

    return { data, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { name: true, email: true, phone: true, avatar: true },
        },
      },
    });

    if (!profile) {
      // Create empty profile if it doesn't exist for a petsitter
      const created = await this.prisma.petsitterProfile.create({
        data: {
          userId,
          bio: '',
          pricePerHour: 50,
          location: '',
          city: '',
          state: '',
          services: [],
          scheduleConfig: {} as Prisma.InputJsonObject,
          isAvailable: true,
          pricingConfig: {} as Prisma.InputJsonObject,
        },
        include: {
          user: {
            select: { name: true, email: true, phone: true, avatar: true },
          },
        },
      });
      return this.withPhotoUrls(await this.withAvatarUrl(created));
    }

    return this.withPhotoUrls(await this.withAvatarUrl(profile));
  }

  /**
   * Grava só o path do documento no Storage. Chamado exclusivamente pelos endpoints
   * de upload (`POST /petsitters/me/identity-proof|address-proof`) — nunca a partir
   * de um DTO de PATCH solto, já que esses campos não são mais aceitos via JSON.
   */
  async updateDocumentPath(
    userId: string,
    field: 'identityProof' | 'addressProof',
    path: string,
  ) {
    return this.prisma.petsitterProfile.update({
      where: { userId },
      data: field === 'identityProof' ? { identityProof: path } : { addressProof: path },
      select: { id: true, userId: true, identityProof: true, addressProof: true },
    });
  }

  /** Path armazenado de um documento, por id do perfil — usado pelos endpoints de leitura. */
  async getDocumentPath(
    profileId: string,
    field: 'identityProof' | 'addressProof',
  ): Promise<{ userId: string; path: string | null }> {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { id: profileId },
      select: { userId: true, identityProof: true, addressProof: true },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de petsitter não encontrado.');
    }

    return {
      userId: profile.userId,
      path: field === 'identityProof' ? profile.identityProof : profile.addressProof,
    };
  }

  async update(
    id: string,
    requestingUserId: string,
    updatePetsitterProfileDto: UpdatePetsitterProfileDto,
  ) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      throw new NotFoundException('Perfil de petsitter não encontrado.');
    }

    if (profile.userId !== requestingUserId) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar o perfil de outro petsitter.',
      );
    }

    if (updatePetsitterProfileDto.services) {
      // Só valida slugs NOVOS contra o catálogo ativo — um slug legado/aposentado/de outra
      // audiência que já estava no perfil (ex.: banho_e_tosa recadastrado como petshop) nunca
      // pode travar o salvamento do resto do perfil. Ver Finding 1 da revisão final.
      const newSlugs = updatePetsitterProfileDto.services.filter(
        (s) => !profile.services.includes(s),
      );
      await this.servicesService.assertValidSlugs(newSlugs, 'petsitter');
    }

    return this.prisma.petsitterProfile.update({
      where: { id },
      data: {
        bio: updatePetsitterProfileDto.bio,
        pricePerHour: updatePetsitterProfileDto.pricePerHour,
        location: updatePetsitterProfileDto.location,
        city: updatePetsitterProfileDto.city,
        state: updatePetsitterProfileDto.state,
        services: updatePetsitterProfileDto.services,
        scheduleConfig: updatePetsitterProfileDto.scheduleConfig
          ? (updatePetsitterProfileDto.scheduleConfig as Prisma.InputJsonObject)
          : undefined,
        isAvailable: updatePetsitterProfileDto.isAvailable,
        offersLocationSharing: updatePetsitterProfileDto.offersLocationSharing,
        pricingConfig: updatePetsitterProfileDto.pricingConfig
          ? (updatePetsitterProfileDto.pricingConfig as Prisma.InputJsonObject)
          : undefined,
        capacityPerDay: updatePetsitterProfileDto.capacityPerDay,
        acceptedSpecies: updatePetsitterProfileDto.acceptedSpecies,
        hasAirConditioning: updatePetsitterProfileDto.hasAirConditioning,
        homeType: updatePetsitterProfileDto.homeType,
        hasBackyard: updatePetsitterProfileDto.hasBackyard,
        walkSchedule: updatePetsitterProfileDto.walkSchedule,
      },
    });
  }

  async updateByUserId(
    userId: string,
    updatePetsitterProfileDto: UpdatePetsitterProfileDto,
  ) {
    const dto = updatePetsitterProfileDto;

    if (dto.services) {
      // Mesmo raciocínio de update(): só valida os slugs NOVOS contra o catálogo ativo,
      // nunca os que já estavam salvos no perfil (perfil pode não existir ainda — nesse
      // caso não há slugs "antigos" a excluir, tudo é novo).
      const existing = await this.prisma.petsitterProfile.findUnique({
        where: { userId },
        select: { services: true },
      });
      const newSlugs = dto.services.filter((s) => !(existing?.services ?? []).includes(s));
      await this.servicesService.assertValidSlugs(newSlugs, 'petsitter');
    }

    const update = {
      bio: dto.bio,
      pricePerHour: dto.pricePerHour,
      location: dto.location,
      city: dto.city,
      state: dto.state,
      services: dto.services,
      scheduleConfig: dto.scheduleConfig as Prisma.InputJsonObject | undefined,
      isAvailable: dto.isAvailable,
      offersLocationSharing: dto.offersLocationSharing,
      pricingConfig: dto.pricingConfig as Prisma.InputJsonObject | undefined,
      capacityPerDay: dto.capacityPerDay,
      acceptedSpecies: dto.acceptedSpecies,
      hasAirConditioning: dto.hasAirConditioning,
      homeType: dto.homeType,
      hasBackyard: dto.hasBackyard,
      walkSchedule: dto.walkSchedule,
    };

    const create = {
      userId,
      bio: update.bio ?? '',
      pricePerHour: update.pricePerHour ?? 50,
      location: update.location ?? '',
      city: update.city ?? '',
      state: update.state ?? '',
      services: update.services ?? [],
      scheduleConfig: (update.scheduleConfig ?? {}) as Prisma.InputJsonObject,
      isAvailable: update.isAvailable ?? true,
      offersLocationSharing: update.offersLocationSharing ?? false,
      pricingConfig: (update.pricingConfig ?? {}) as Prisma.InputJsonObject,
      capacityPerDay: update.capacityPerDay ?? 1,
      acceptedSpecies: update.acceptedSpecies ?? [],
      hasAirConditioning: update.hasAirConditioning ?? false,
      homeType: update.homeType,
      hasBackyard: update.hasBackyard ?? false,
      walkSchedule: update.walkSchedule,
    };

    return this.prisma.petsitterProfile.upsert({
      where: { userId },
      update,
      create,
    });
  }

  async getCities() {
    const records = await this.prisma.petsitterProfile.findMany({
      where: { city: { not: '' } },
      select: { city: true },
      distinct: ['city'],
    });
    return records.map(r => r.city);
  }

  async changeStatus(id: string, status: PetsitterStatus) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { id },
    });
    if (!profile) throw new NotFoundException('Perfil não encontrado');

    return this.prisma.petsitterProfile.update({
      where: { id },
      data: { status },
    });
  }

  private static readonly MAX_PHOTOS = 8;

  /** `path` já é o path real gravado no Storage pelo controller (que fez o upload antes de
   * chamar este método) — devolve o array atualizado já como signed URLs. */
  async addPhoto(userId: string, path: string) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { userId },
      select: { photos: true },
    });
    if (!profile) {
      throw new NotFoundException('Perfil de petsitter não encontrado.');
    }
    if (profile.photos.length >= PetsittersService.MAX_PHOTOS) {
      throw new BadRequestException(
        `Limite de ${PetsittersService.MAX_PHOTOS} fotos atingido. Remova uma foto antes de adicionar outra.`,
      );
    }

    const updated = await this.prisma.petsitterProfile.update({
      where: { userId },
      data: { photos: [...profile.photos, path] },
      select: { photos: true },
    });
    return this.withPhotoUrls(updated);
  }

  /** `index` é a posição no array — único identificador estável que o frontend tem, já que ele
   * só vê signed URLs (nunca os paths reais). Resolve o path real internamente, apaga do Storage,
   * e só então atualiza o array — devolve o array atualizado já como signed URLs. */
  async removePhoto(userId: string, index: number) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { userId },
      select: { photos: true },
    });
    if (!profile) {
      throw new NotFoundException('Perfil de petsitter não encontrado.');
    }
    if (index < 0 || index >= profile.photos.length) {
      throw new BadRequestException('Índice de foto inválido.');
    }

    const pathToRemove = profile.photos[index];
    await this.storageService.deleteObject(pathToRemove);

    const updated = await this.prisma.petsitterProfile.update({
      where: { userId },
      data: { photos: profile.photos.filter((_, i) => i !== index) },
      select: { photos: true },
    });
    return this.withPhotoUrls(updated);
  }
}
