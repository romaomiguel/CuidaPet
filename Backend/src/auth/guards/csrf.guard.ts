import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CSRF_TOKEN_COOKIE, CSRF_TOKEN_HEADER } from '../cookie.util';

/**
 * Double-submit cookie: exige que o valor do cookie csrf_token (legível por JS, setado no
 * login/register/refresh) bata com o header x-csrf-token enviado pelo cliente. Um site
 * atacante não consegue ler o cookie de outro domínio nem setar um header custom sem
 * disparar preflight de CORS — que a allowlist de origem em main.ts já bloqueia.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const cookieValue = request.cookies?.[CSRF_TOKEN_COOKIE];
    const headerValue = request.headers[CSRF_TOKEN_HEADER];

    if (!cookieValue || !headerValue || cookieValue !== headerValue) {
      throw new ForbiddenException('Falha na validação CSRF.');
    }

    return true;
  }
}
