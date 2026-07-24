import { Controller, Post, Body, Get, Patch, UseGuards, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { AuthService, TokenPair, SafeUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import {
  REFRESH_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  getRefreshCookieOptions,
  getCsrfCookieOptions,
} from './cookie.util';

@ApiTags('auth')
// Sobrescreve o limite global (100/min) de volta pro valor estrito original — login/
// registro/refresh continuam em 10/min. O guard em si já vem do APP_GUARD global
// (app.module.ts); manter @UseGuards(ThrottlerGuard) aqui duplicaria a checagem por
// requisição (consumiria o bucket duas vezes).
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /** Seta o cookie httpOnly do refresh token + o cookie CSRF legível por JS. */
  private setAuthCookies(res: Response, pair: Pick<TokenPair, 'rawRefreshToken'>): void {
    res.cookie(REFRESH_TOKEN_COOKIE, pair.rawRefreshToken, getRefreshCookieOptions());
    res.cookie(CSRF_TOKEN_COOKIE, crypto.randomBytes(32).toString('hex'), getCsrfCookieOptions());
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/auth' });
    res.clearCookie(CSRF_TOKEN_COOKIE, { path: '/' });
  }

  private buildResponseBody(accessToken: string, user: SafeUser) {
    return { access_token: accessToken, user };
  }

  @Post('register')
  @ApiOperation({ summary: 'Cadastrar novo usuário e autenticar' })
  @ApiResponse({ status: 201, description: 'Usuário cadastrado e autenticado com sucesso.' })
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.usersService.create(createUserDto);
    const pair = await this.authService.issueTokenPair(user);
    this.setAuthCookies(res, pair);
    // Usuário recém-criado nunca tem avatar ainda (só é setado via upload depois).
    return this.buildResponseBody(pair.accessToken, { ...user, avatarUrl: null });
  }

  @Post('login')
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateCredentials(loginDto);
    const pair = await this.authService.issueTokenPair(user);
    this.setAuthCookies(res, pair);
    return this.buildResponseBody(pair.accessToken, user);
  }

  @Post('refresh')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Renovar o access token usando o refresh token (cookie httpOnly)' })
  @ApiResponse({ status: 200, description: 'Access token renovado.' })
  @ApiResponse({ status: 401, description: 'Refresh token ausente, inválido ou expirado.' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

    try {
      const { accessToken, rawRefreshToken, user } = await this.authService.rotateRefreshToken(rawToken);
      this.setAuthCookies(res, { rawRefreshToken });
      return this.buildResponseBody(accessToken, user);
    } catch (err) {
      this.clearAuthCookies(res);
      throw err;
    }
  }

  @Post('logout')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Realizar logout (revoga o refresh token)' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    await this.authService.revokeRefreshToken(rawToken);
    this.clearAuthCookies(res);
    return { success: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  getProfile(@CurrentUser() user: { id: string; role: string; email: string }) {
    return this.usersService.findOne(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiOperation({ summary: 'Atualizar dados do usuário logado' })
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, updateUserDto);
  }
}
