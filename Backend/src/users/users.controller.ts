import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
