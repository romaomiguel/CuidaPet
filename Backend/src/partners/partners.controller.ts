import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PartnerType } from '@prisma/client';
import { StorageService, AVATAR_ALLOWED_EXTS } from '../storage/storage.service';
import { avatarMulterOptions } from '../storage/multer-options';
import * as crypto from 'crypto';

@ApiTags('partners')
@Controller('partners')
export class PartnersController {
  constructor(
    private readonly partnersService: PartnersService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Cadastrar Clínica ou Petshop e gerar credenciais' })
  @ApiResponse({ status: 201, description: 'Parceiro criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'E-mail já está em uso.' })
  create(@Body() dto: CreatePartnerDto) {
    return this.partnersService.create(dto);
  }

  @Get('admin/list')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Listar parceiros (Clínicas e Petshops)' })
  findAllForAdmin(
    @Query('type') type?: PartnerType,
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.partnersService.findAllForAdmin({
      type,
      city,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('partner')
  @ApiOperation({ summary: 'Buscar perfil do parceiro logado' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  findMe(@CurrentUser() user: { id: string }) {
    return this.partnersService.findByUserId(user.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('partner')
  @ApiOperation({ summary: 'Atualizar perfil do parceiro logado' })
  updateMe(@CurrentUser() user: { id: string }, @Body() dto: UpdatePartnerDto) {
    return this.partnersService.update(user.id, dto);
  }

  @Post('me/photos')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('partner')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('photo', avatarMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Adicionar uma foto à galeria do parceiro logado (máx. 8)' })
  @ApiResponse({ status: 201, description: 'Foto adicionada.' })
  @ApiResponse({ status: 400, description: 'Limite de fotos atingido ou arquivo inválido.' })
  async addPhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    const detected = await this.storageService.validateFileSignature(file.buffer, AVATAR_ALLOWED_EXTS);
    const path = `${user.id}/photos/${crypto.randomUUID()}.${detected.ext}`;
    await this.storageService.uploadObject(path, file.buffer, detected.mime);
    return this.partnersService.addPhoto(user.id, path);
  }

  @Delete('me/photos/:index')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('partner')
  @ApiOperation({ summary: 'Remover, pela posição no array, uma foto da galeria do parceiro logado' })
  @ApiResponse({ status: 400, description: 'Índice de foto inválido.' })
  removePhoto(
    @Param('index', ParseIntPipe) index: number,
    @CurrentUser() user: { id: string },
  ) {
    return this.partnersService.removePhoto(user.id, index);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar perfil público de um parceiro por ID' })
  @ApiResponse({ status: 404, description: 'Parceiro não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }
}
