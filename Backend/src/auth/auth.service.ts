import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService, AVATAR_SIGNED_URL_TTL_SECONDS } from '../storage/storage.service';
import { LoginDto } from './dto/login.dto';
import { getRefreshTokenTtlMs } from './cookie.util';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  avatarUrl: string | null;
  isActive: boolean;
}

export interface TokenPair {
  accessToken: string;
  rawRefreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly storageService: StorageService,
  ) {}

  async validateCredentials(loginDto: LoginDto): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Sua conta foi suspensa. Entre em contato com o suporte.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      avatarUrl: await this.storageService.createAvatarUrl(user.avatar, AVATAR_SIGNED_URL_TTL_SECONDS),
      isActive: user.isActive,
    };
  }

  private signAccessToken(user: Pick<SafeUser, 'id' | 'email' | 'role'>): string {
    return this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /** Emite um novo par access+refresh e persiste o refresh (hasheado) no banco. */
  async issueTokenPair(user: Pick<SafeUser, 'id' | 'email' | 'role'>, userAgent?: string): Promise<TokenPair> {
    const accessToken = this.signAccessToken(user);
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + getRefreshTokenTtlMs());

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawRefreshToken),
        expiresAt: refreshExpiresAt,
        userAgent: userAgent ?? null,
      },
    });

    return { accessToken, rawRefreshToken, refreshExpiresAt };
  }

  /**
   * Valida o refresh token apresentado, rotaciona (revoga o atual, emite um novo) e
   * devolve o novo par + o usuário. Lança UnauthorizedException em qualquer falha —
   * inclusive quando detecta reuso de um token já revogado, caso em que primeiro
   * revoga TODAS as sessões ativas do usuário (mitigação de replay).
   */
  async rotateRefreshToken(rawToken: string | undefined): Promise<TokenPair & { user: SafeUser }> {
    if (!rawToken) {
      throw new UnauthorizedException('Refresh token ausente.');
    }

    const tokenHash = this.hashToken(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    if (existing.revokedAt) {
      // Reuso de um token já rotacionado: possível token roubado. Derruba tudo.
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token já utilizado. Sessão revogada por segurança.');
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado.');
    }

    if (!existing.user.isActive) {
      throw new UnauthorizedException('Sua conta foi suspensa.');
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const safeUser: SafeUser = {
      id: existing.user.id,
      name: existing.user.name,
      email: existing.user.email,
      role: existing.user.role,
      avatar: existing.user.avatar,
      avatarUrl: await this.storageService.createAvatarUrl(existing.user.avatar, AVATAR_SIGNED_URL_TTL_SECONDS),
      isActive: existing.user.isActive,
    };

    const pair = await this.issueTokenPair(safeUser);
    return { ...pair, user: safeUser };
  }

  /** Revoga o refresh token apresentado (se existir/for válido). Nunca lança — logout é best-effort. */
  async revokeRefreshToken(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;

    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
