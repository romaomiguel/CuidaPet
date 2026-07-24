/**
 * `file-type` (a partir da v17) é um pacote ESM-only. O tsconfig deste projeto usa
 * `moduleResolution: "node"` (clássico), que não resolve o `exports` map do pacote real —
 * é um problema só de type-checking, o `await import('file-type')` funciona normalmente
 * em runtime (Node CJS consegue importar ESM dinamicamente). Esta declaração ambiente
 * cobre só a função que usamos, evitando mudar o moduleResolution global do projeto.
 */
declare module 'file-type' {
  export interface FileTypeResult {
    readonly ext: string;
    readonly mime: string;
  }

  export function fileTypeFromBuffer(
    buffer: Uint8Array | ArrayBuffer,
  ): Promise<FileTypeResult | undefined>;
}
