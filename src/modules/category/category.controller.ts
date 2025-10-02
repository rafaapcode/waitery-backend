import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ParseULIDPipe } from 'src/common/pipes/ParseULIDPipe';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryUseCase } from './usecases/CreateCategoryUseCase';
import { DeleteCategoryUseCase } from './usecases/DeleteCategoryUseCase';
import { GetAllCategoryUseCase } from './usecases/GetAllCategoryUseCase';
import { GetByIdCategoryUseCase } from './usecases/GetByIdCategoryUseCase';
import { UpdateCategoryUseCase } from './usecases/UpdateCategoryUseCase';

@Controller('category')
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly getByIdCategoryUseCase: GetByIdCategoryUseCase,
    private readonly getAllCategoryUseCase: GetAllCategoryUseCase,
  ) {}

  @Post(':org_id')
  create(
    @Param('org_id', ParseULIDPipe) org_id: string,
    @Body() data: CreateCategoryDto,
  ) {
    return this.createCategoryUseCase.execute({
      org_id,
      data,
    });
  }

  @Get('/all/:org_id')
  getAllCategories(@Param('org_id', ParseULIDPipe) org_id: string) {
    return this.getAllCategoryUseCase.execute(org_id);
  }

  @Get(':id')
  getById(@Param('id', ParseULIDPipe) id: string) {
    return this.getByIdCategoryUseCase.execute(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseULIDPipe) id: string,
    @Body() data: UpdateCategoryDto,
  ) {
    return this.updateCategoryUseCase.execute(id, data);
  }

  @Delete(':id')
  delete(@Param('id', ParseULIDPipe) id: string) {
    return this.deleteCategoryUseCase.execute(id);
  }
}
