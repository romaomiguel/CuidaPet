/**
 * Arquivo mantido por compatibilidade de imports residuais.
 * Os serviços agora chamam a API diretamente — sem mock.
 */

export const IS_MOCK_MODE = false

export async function withMockFallback<T>(
  apiFn: () => Promise<T>,
  _mockFn: () => T,
): Promise<T> {
  return apiFn()
}
