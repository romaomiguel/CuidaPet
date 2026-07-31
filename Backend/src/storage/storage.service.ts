import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { FileTypeResult } from 'file-type';

const BUCKET = 'petsitter-documents';

/** Extensões reais (detectadas por magic bytes) aceitas por tipo de upload. */
export const AVATAR_ALLOWED_EXTS = ['jpg', 'png', 'webp'];
export const DOCUMENT_ALLOWED_EXTS = ['jpg', 'png', 'pdf'];

/** MIME declarado pelo browser — primeira barreira barata, checada pelo multer antes do upload. */
export const AVATAR_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const DOCUMENT_ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'];

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

/** TTL das signed URLs devolvidas ao cliente. Avatar precisa durar o suficiente pra
 * não expirar no meio de uma sessão de navegação comum; documento é bem mais curto
 * (visto raramente, só no clique de "ver documento"). */
export const AVATAR_SIGNED_URL_TTL_SECONDS = 600;
export const DOCUMENT_SIGNED_URL_TTL_SECONDS = 300;

interface SignedUrlOptions {
  /** Força Content-Disposition: attachment — impede o browser de renderizar o
   * conteúdo inline (ex.: HTML/SVG disfarçado) ao abrir a URL diretamente. */
  download?: boolean;
}

/**
 * Único ponto de contato com o Supabase Storage no backend. Usa a service_role key
 * (bypassa RLS do Storage) — NUNCA logar/expor essa key ou o client cru, e NUNCA
 * repassar o objeto de erro do Supabase pro chamador (evita vazar detalhe interno).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error(
        '[StorageService] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados. ' +
          'Configure as variáveis de ambiente antes de iniciar o servidor.',
      );
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  /**
   * Confirma que o CONTEÚDO REAL do arquivo (assinatura/magic bytes) bate com um dos
   * tipos permitidos — nunca confiar só no MIME/extensão declarados pelo cliente, que
   * são trivialmente falsificáveis. Deve ser a primeira coisa chamada no fluxo de
   * upload, sempre ANTES de qualquer chamada a `uploadObject`. Devolve o tipo real
   * detectado (ext/mime) para o path no Storage usar a extensão verdadeira, nunca a
   * que o cliente declarou.
   */
  async validateFileSignature(buffer: Buffer, allowedExts: string[]): Promise<FileTypeResult> {
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(buffer);

    if (!detected || !allowedExts.includes(detected.ext)) {
      throw new BadRequestException(
        `Conteúdo do arquivo não corresponde a um formato permitido (${allowedExts.join(', ')}).`,
      );
    }

    return detected;
  }

  /** Grava/sobrescreve (upsert) um objeto no bucket privado `petsitter-documents`. */
  async uploadObject(path: string, buffer: Buffer, contentType: string): Promise<void> {
    const { error } = await this.client.storage.from(BUCKET).upload(path, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      this.logger.error(`Falha ao gravar '${path}' no Storage: ${error.message}`);
      throw new InternalServerErrorException('Não foi possível salvar o arquivo. Tente novamente.');
    }
  }

  /** Remove um objeto do bucket. Usado ao apagar uma foto de galeria. */
  async deleteObject(path: string): Promise<void> {
    const { error } = await this.client.storage.from(BUCKET).remove([path]);

    if (error) {
      this.logger.error(`Falha ao remover '${path}' do Storage: ${error.message}`);
      throw new InternalServerErrorException('Não foi possível remover o arquivo. Tente novamente.');
    }
  }

  /** Gera uma signed URL de vida curta para leitura de um objeto privado. */
  async createSignedUrl(
    path: string,
    expiresInSeconds: number,
    opts: SignedUrlOptions = {},
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresInSeconds, { download: opts.download });

    if (error || !data?.signedUrl) {
      this.logger.error(`Falha ao gerar signed URL para '${path}': ${error?.message}`);
      throw new InternalServerErrorException('Não foi possível gerar o link de acesso ao arquivo.');
    }

    return data.signedUrl;
  }

  /**
   * Como `createSignedUrl`, mas devolve `null` em vez de lançar quando o path é vazio
   * ou a assinatura falha — usado nos endpoints de leitura de avatar, onde um avatar
   * quebrado não deve derrubar a resposta inteira (ex.: listagem de petsitters).
   */
  async createAvatarUrl(path: string | null | undefined, expiresInSeconds: number): Promise<string | null> {
    if (!path) return null;
    try {
      return await this.createSignedUrl(path, expiresInSeconds);
    } catch {
      return null;
    }
  }

  /**
   * Versão em lote de `createAvatarUrl`, para listagens (evita 1 chamada à API do
   * Supabase por linha). Devolve um Map path -> signedUrl; paths que falharem
   * simplesmente não aparecem no Map (o chamador trata como avatar ausente).
   */
  async createAvatarUrls(paths: string[], expiresInSeconds: number): Promise<Map<string, string>> {
    const uniquePaths = [...new Set(paths.filter((p): p is string => Boolean(p)))];
    const result = new Map<string, string>();
    if (uniquePaths.length === 0) return result;

    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrls(uniquePaths, expiresInSeconds);

    if (error) {
      this.logger.error(`Falha ao gerar signed URLs em lote: ${error.message}`);
      return result;
    }

    for (const item of data ?? []) {
      if (item.signedUrl && !item.error && item.path) {
        result.set(item.path, item.signedUrl);
      }
    }

    return result;
  }
}
