import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService, AVATAR_SIGNED_URL_TTL_SECONDS } from '../storage/storage.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /** `avatar` guarda um path do Storage (não uma URL) — troca por signed URL só na saída. */
  private async withAvatarUrl<T extends { avatar: string | null }>(
    user: T,
  ): Promise<T & { avatarUrl: string | null }> {
    const avatarUrl = await this.storageService.createAvatarUrl(user.avatar, AVATAR_SIGNED_URL_TTL_SECONDS);
    return { ...user, avatarUrl };
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já está em uso.');
    }

    if (createUserDto.cpf) {
      const existingCpf = await this.prisma.user.findUnique({
        where: { cpf: createUserDto.cpf },
      });
      if (existingCpf) {
        throw new ConflictException('CPF já está em uso.');
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        ...(createUserDto.role === 'petsitter' && {
          petsitterProfile: {
            create: {
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
          },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async changeStatus(id: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async makeAdmin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role: 'admin' },
      select: { id: true, name: true, role: true }
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.withAvatarUrl(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('E-mail já está em uso.');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        avatar: true,
        bio: true,
        role: true,
      },
    });

    return this.withAvatarUrl(updated);
  }

  /**
   * Grava só o path do avatar no Storage. Chamado exclusivamente pelo endpoint de
   * upload (`POST /users/me/avatar`) — nunca a partir de um DTO de PATCH solto, já
   * que `avatar` não é mais um campo aceito via JSON (ver CreateUserDto/UpdateUserDto).
   */
  async updateAvatarPath(userId: string, path: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: path },
      select: { id: true, avatar: true },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Usuário removido com sucesso.' };
  }
}
