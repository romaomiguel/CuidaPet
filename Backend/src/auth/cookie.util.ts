import type { CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const CSRF_TOKEN_COOKIE = 'csrf_token';
export const CSRF_TOKEN_HEADER = 'x-csrf-token';

export function getRefreshTokenTtlMs(): number {
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);
  return days * 24 * 60 * 60 * 1000;
}

/**
 * SameSite=None exige Secure. Em dev (http://localhost) o browser derruba cookies Secure,
 * por isso o par muda inteiro com NODE_ENV — nunca hardcoded por domínio.
 */
function baseCookieOptions(): Pick<CookieOptions, 'secure' | 'sameSite' | 'maxAge'> {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: getRefreshTokenTtlMs(),
  };
}

export function getRefreshCookieOptions(): CookieOptions {
  // path '/auth': o refresh token só precisa trafegar pras rotas /auth/* (refresh, logout).
  return { httpOnly: true, path: '/auth', ...baseCookieOptions() };
}

export function getCsrfCookieOptions(): CookieOptions {
  // httpOnly: false de propósito — o frontend precisa ler esse valor e ecoar como header.
  // path '/' (não '/auth'): o silent-refresh dispara a partir de QUALQUER página do site (ex:
  // a home no boot do app), e document.cookie só enxerga cookies cujo path cubra a página atual.
  // Com path '/auth' o JS fora de /auth lia string vazia, o header x-csrf-token ia vazio, e o
  // /auth/refresh devolvia 403 — era isso que derrubava a sessão no F5.
  return { httpOnly: false, path: '/', ...baseCookieOptions() };
}
