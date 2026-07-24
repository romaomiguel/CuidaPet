import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
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
  AVATAR_ALLOWED_EXTS,
  AVATAR_SIGNED_URL_TTL_SECONDS,
} from '../storage/storage.service';
import { avatarMulterOptions } from '../storage/multer-options';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Post('me/avatar')
  // Mais restritivo que o global (100/min) — cada chamada grava no Storage; sem isso
  // um usuário autenticado poderia martelar upload sem limite (custo de banda/Storage).
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('avatar', avatarMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload do avatar do usuário logado' })
  @ApiResponse({ status: 201, description: 'Avatar atualizado, devolve signed URL de leitura.' })
  @ApiResponse({ status: 400, description: 'Arquivo ausente, grande demais ou de tipo não suportado.' })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const detected = await this.storageService.validateFileSignature(file.buffer, AVATAR_ALLOWED_EXTS);
    const path = `${user.id}/avatar/current.${detected.ext}`;

    await this.storageService.uploadObject(path, file.buffer, detected.mime);
    await this.usersService.updateAvatarPath(user.id, path);

    const avatarUrl = await this.storageService.createSignedUrl(path, AVATAR_SIGNED_URL_TTL_SECONDS);
    return { avatarUrl };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Listar todos os usuários' })
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Suspender/Banir usuário' })
  changeStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.changeStatus(id, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar dados do próprio usuário por ID' })
  @ApiResponse({ status: 200, description: 'Dados do usuário.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string },
  ) {
    if (id !== currentUser.id) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar os dados de outro usuário.',
      );
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do próprio usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  update(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (id !== currentUser.id) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar dados de outro usuário.',
      );
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover a própria conta' })
  @ApiResponse({ status: 200, description: 'Conta removida.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string },
  ) {
    if (id !== currentUser.id) {
      throw new ForbiddenException(
        'Você não tem permissão para remover a conta de outro usuário.',
      );
    }
    return this.usersService.remove(id);
  }
}
