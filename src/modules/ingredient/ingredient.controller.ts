import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseULIDPipe } from 'src/common/pipes/ParseULIDPipe';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { CreateIngredientUseCase } from './usecases/CreateIngredientUseCase';
import { DeleteIngredientUseCase } from './usecases/DeleteIngredientUseCase';
import { GetAllIngredientUseCase } from './usecases/GetAllIngredientUseCase';
import { GetIngredientUseCase } from './usecases/GetIngredientUseCase';
import { UpdateIngredientUseCase } from './usecases/UpdateIngredientUseCase';

@ApiTags('Ingredients')
@Controller('ingredient')
export class IngredientController {
  constructor(
    private readonly createIngredientUseCase: CreateIngredientUseCase,
    private readonly deleteIngredientUseCase: DeleteIngredientUseCase,
    private readonly updateIngredientUseCase: UpdateIngredientUseCase,
    private readonly getIngredientUseCase: GetIngredientUseCase,
    private readonly getAllIngredientUseCase: GetAllIngredientUseCase,
  ) {}

  @Post()
  create(@Body() data: CreateIngredientDto) {
    return this.createIngredientUseCase.execute(data);
  }

  @Get()
  getAll() {
    return this.getAllIngredientUseCase.execute();
  }

  @Get(':id')
  getOne(@Param('id', ParseULIDPipe) id: string) {
    return this.getIngredientUseCase.execute(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseULIDPipe) id: string,
    @Body() data: UpdateIngredientDto,
  ) {
    return this.updateIngredientUseCase.execute({
      id,
      data,
    });
  }

  @Delete(':id')
  delete(@Param('id', ParseULIDPipe) id: string) {
    return this.deleteIngredientUseCase.execute(id);
  }
}
