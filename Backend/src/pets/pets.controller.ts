import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('pets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @Roles('tutor')
  @ApiOperation({ summary: 'Criar um novo pet' })
  @ApiResponse({ status: 201, description: 'Pet criado com sucesso.' })
  create(
    @CurrentUser() user: { id: string },
    @Body() createPetDto: CreatePetDto,
  ) {
    return this.petsService.create(user.id, createPetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pets do tutor logado' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.petsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pet por ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.petsService.findOne(id, user.id);
  }

  @Patch(':id')
  @Roles('tutor')
  @ApiOperation({ summary: 'Atualizar pet' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() updatePetDto: UpdatePetDto,
  ) {
    return this.petsService.update(id, user.id, updatePetDto);
  }

  @Delete(':id')
  @Roles('tutor')
  @ApiOperation({ summary: 'Remover pet' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.petsService.remove(id, user.id);
  }
}
