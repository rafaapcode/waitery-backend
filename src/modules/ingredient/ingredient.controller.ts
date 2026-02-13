import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/Role';
import { ParseULIDPipe } from 'src/common/pipes/ParseULIDPipe';
import { UserRole } from 'src/core/domain/entities/user';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { CreateIngredientUseCase } from './usecases/CreateIngredientUseCase';
import { GetAllIngredientUseCase } from './usecases/GetAllIngredientUseCase';
import { GetIngredientUseCase } from './usecases/GetIngredientUseCase';
import { UpdateIngredientUseCase } from './usecases/UpdateIngredientUseCase';

@ApiTags('Ingredients')
@Controller('ingredients')
export class IngredientController {
  constructor(
    private readonly createIngredientUseCase: CreateIngredientUseCase,
    private readonly updateIngredientUseCase: UpdateIngredientUseCase,
    private readonly getIngredientUseCase: GetIngredientUseCase,
    private readonly getAllIngredientUseCase: GetAllIngredientUseCase,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Post()
  create(@Body() data: CreateIngredientDto) {
    return this.createIngredientUseCase.execute(data);
  }

  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Get()
  @HttpCode(HttpStatus.OK)
  getAll() {
    return this.getAllIngredientUseCase.execute();
  }

  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getOne(@Param('id', ParseULIDPipe) id: string) {
    return this.getIngredientUseCase.execute(id);
  }

  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseULIDPipe) id: string,
    @Body() data: UpdateIngredientDto,
  ) {
    return this.updateIngredientUseCase.execute({
      id,
      data,
    });
  }
}
