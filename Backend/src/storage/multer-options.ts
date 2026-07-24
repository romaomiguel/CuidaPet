import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import {
  AVATAR_ALLOWED_MIME,
  DOCUMENT_ALLOWED_MIME,
  MAX_UPLOAD_SIZE_BYTES,
} from './storage.service';

/**
 * `storage: memoryStorage()` é obrigatório aqui — sem isso o multer usa disk storage
 * por padrão e `file.buffer` vem undefined, o que quebra tanto a checagem de magic
 * bytes quanto o upload pro Supabase (que espera um Buffer em memória).
 */
function fileFilterFor(allowedMime: string[]) {
  return (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `Tipo de arquivo não permitido. Formatos aceitos: ${allowedMime.join(', ')}.`,
        ),
        false,
      );
    }
  };
}

export const avatarMulterOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: fileFilterFor(AVATAR_ALLOWED_MIME),
};

export const documentMulterOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: fileFilterFor(DOCUMENT_ALLOWED_MIME),
};
