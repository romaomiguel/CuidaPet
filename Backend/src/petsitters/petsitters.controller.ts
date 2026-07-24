import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { PetsittersService } from './petsitters.service';
import { CreatePetsitterProfileDto } from './dto/create-petsitter-profile.dto';
import { UpdatePetsitterProfileDto } from './dto/update-petsitter-profile.dto';
import { UpdatePetsitterStatusDto } from './dto/update-petsitter-status.dto';
import { MatchPetsittersDto } from './dto/match-petsitters.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  StorageService,
  DOCUMENT_ALLOWED_EXTS,
  DOCUMENT_SIGNED_URL_TTL_SECONDS,
} from '../storage/storage.service';
import { documentMulterOptions } from '../storage/multer-options';

type DocumentRouteField = 'identity-proof' | 'address-proof';
type DocumentDbField = 'identityProof' | 'addressProof';

function toDbField(field: string): DocumentDbField {
  if (field === 'identity-proof') return 'identityProof';
  if (field === 'address-proof') return 'addressProof';
  throw new BadRequestException("Campo inválido. Use 'identity-proof' ou 'address-proof'.");
}

@ApiTags('petsitters')
@Controller('petsitters')
export class PetsittersController {
  constructor(
    private readonly petsittersService: PetsittersService,
    private readonly storageService: StorageService,
  ) {}

  private async uploadDocument(
    file: Express.Multer.File | undefined,
    userId: string,
    field: DocumentDbField,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const detected = await this.storageService.validateFileSignature(file.buffer, DOCUMENT_ALLOWED_EXTS);
    const folder = field === 'identityProof' ? 'identity-proof' : 'address-proof';
    const path = `${userId}/documents/${folder}.${detected.ext}`;

    await this.storageService.uploadObject(path, file.buffer, detected.mime);
    await this.petsittersService.updateDocumentPath(userId, field, path);

    const url = await this.storageService.createSignedUrl(path, DOCUMENT_SIGNED_URL_TTL_SECONDS, {
      download: true,
    });
    return { url };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petsitter')
  @ApiOperation({ summary: 'Criar perfil de petsitter' })
  @ApiResponse({ status: 201, description: 'Perfil criado com sucesso.' })
  @ApiResponse({
    status: 409,
    description: 'Conflito (usuário já tem perfil).',
  })
  create(
    @CurrentUser() user: { id: string },
    @Body() createPetsitterProfileDto: CreatePetsitterProfileDto,
  ) {
    return this.petsittersService.create(user.id, createPetsitterProfileDto);
  }

  @Post('match')
  // Rota pública (sem guard) e com cálculo de scoring sobre todos os aprovados —
  // mais restritivo que o global pra não virar vetor de scraping/DoS.
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Encontrar petsitters ideais (Match)' })
  @ApiResponse({ status: 200, description: 'Matches encontrados com sucesso.' })
  findMatches(@Body() matchPetsittersDto: MatchPetsittersDto) {
    return this.petsittersService.findMatches(matchPetsittersDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar petsitters com paginação' })
  findAll(
    @Query('city')      city?: string,
    @Query('service')   service?: string,
    @Query('minRating') minRating?: string,
    @Query('maxPrice')  maxPrice?: string,
    @Query('page')      page?: string,
    @Query('limit')     limit?: string,
    @Query('status')    status?: string,
  ) {
    return this.petsittersService.findAll({
      city,
      service,
      minRating: minRating ? Number(minRating) : undefined,
      maxPrice:  maxPrice  ? Number(maxPrice)  : undefined,
      page:      page      ? Number(page)      : 1,
      limit:     limit     ? Number(limit)     : 20,
      status,
    });
  }

  @Get('cities')
  @ApiOperation({ summary: 'Obter lista de cidades disponíveis' })
  getCities() {
    return this.petsittersService.getCities();
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petsitter')
  @ApiOperation({ summary: 'Buscar perfil do petsitter logado' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  findMe(@CurrentUser() user: { id: string }) {
    return this.petsittersService.findByUserId(user.id);
  }

  @ApiBearerAuth()
  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petsitter')
  @ApiOperation({ summary: 'Atualizar perfil do petsitter logado' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  updateMe(
    @CurrentUser() user: { id: string },
    @Body() updatePetsitterProfileDto: UpdatePetsitterProfileDto,
  ) {
    return this.petsittersService.updateByUserId(
      user.id,
      updatePetsitterProfileDto,
    );
  }

  @Post('me/identity-proof')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petsitter')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', documentMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload do documento de identidade (RG/CNH) do petsitter logado' })
  @ApiResponse({ status: 201, description: 'Documento enviado.' })
  @ApiResponse({ status: 400, description: 'Arquivo ausente, grande demais ou de tipo não suportado.' })
  uploadIdentityProof(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    return this.uploadDocument(file, user.id, 'identityProof');
  }

  @Post('me/address-proof')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petsitter')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', documentMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload do comprovante de residência do petsitter logado' })
  @ApiResponse({ status: 201, description: 'Documento enviado.' })
  @ApiResponse({ status: 400, description: 'Arquivo ausente, grande demais ou de tipo não suportado.' })
  uploadAddressProof(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    return this.uploadDocument(file, user.id, 'addressProof');
  }

  @Get('me/documents/:field/url')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petsitter')
  @ApiOperation({ summary: 'Signed URL (5min) do próprio documento enviado' })
  @ApiResponse({ status: 404, description: 'Perfil ou documento não encontrado.' })
  async getMyDocumentUrl(
    @Param('field') field: string,
    @CurrentUser() user: { id: string },
  ) {
    const dbField = toDbField(field);
    const profile = await this.petsittersService.findByUserId(user.id);
    const path = dbField === 'identityProof' ? profile.identityProof : profile.addressProof;

    if (!path) {
      throw new BadRequestException('Nenhum documento enviado para este campo ainda.');
    }

    const url = await this.storageService.createSignedUrl(path, DOCUMENT_SIGNED_URL_TTL_SECONDS, {
      download: true,
    });
    return { url };
  }

  @Get('admin/list')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Listar petsitters com indicador de documentos enviados' })
  findAllForAdmin(
    @Query('city')   city?: string,
    @Query('status') status?: string,
    @Query('page')   page?: string,
    @Query('limit')  limit?: string,
  ) {
    return this.petsittersService.findAllForAdmin({
      city,
      status,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id/documents/:field/url')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Signed URL (5min) do documento de qualquer petsitter' })
  @ApiResponse({ status: 404, description: 'Perfil ou documento não encontrado.' })
  async getPetsitterDocumentUrl(
    @Param('id') id: string,
    @Param('field') field: string,
  ) {
    const dbField = toDbField(field);
    const { path } = await this.petsittersService.getDocumentPath(id, dbField);

    if (!path) {
      throw new BadRequestException('Nenhum documento enviado para este campo ainda.');
    }

    const url = await this.storageService.createSignedUrl(path, DOCUMENT_SIGNED_URL_TTL_SECONDS, {
      download: true,
    });
    return { url };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar perfil de petsitter por ID' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.petsittersService.findOne(id);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualizar perfil de petsitter por ID (somente o dono)' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() updatePetsitterProfileDto: UpdatePetsitterProfileDto,
  ) {
    return this.petsittersService.update(id, user.id, updatePetsitterProfileDto);
  }

  @ApiBearerAuth()
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Atualizar status do petsitter por ID (apenas Admin)' })
  @ApiResponse({ status: 200, description: 'Status atualizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  changeStatus(
    @Param('id') id: string,
    @Body() updatePetsitterStatusDto: UpdatePetsitterStatusDto,
  ) {
    return this.petsittersService.changeStatus(id, updatePetsitterStatusDto.status);
  }
}
