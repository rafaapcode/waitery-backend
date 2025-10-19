import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/Role';
import { ParseULIDPipe } from 'src/common/pipes/ParseULIDPipe';
import { UserRole } from 'src/core/domain/entities/user';
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

  @Roles(UserRole.OWNER, UserRole.ADMIN)
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
  @HttpCode(HttpStatus.OK)
  getAllCategories(@Param('org_id', ParseULIDPipe) org_id: string) {
    return this.getAllCategoryUseCase.execute(org_id);
  }

  @Get(':id/:org_id')
  @HttpCode(HttpStatus.OK)
  getById(
    @Param('id', ParseULIDPipe) id: string,
    @Param('org_id', ParseULIDPipe) org_id: string,
  ) {
    return this.getByIdCategoryUseCase.execute(id, org_id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch(':id/:org_id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseULIDPipe) id: string,
    @Param('org_id', ParseULIDPipe) org_id: string,
    @Body() data: UpdateCategoryDto,
  ) {
    return this.updateCategoryUseCase.execute(id, org_id, data);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':id/:org_id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseULIDPipe) id: string,
    @Param('org_id', ParseULIDPipe) org_id: string,
  ) {
    await this.deleteCategoryUseCase.execute(id, org_id);
    return { message: 'Category deleted with success !' };
  }
}
