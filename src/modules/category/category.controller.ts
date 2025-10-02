import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    throw new NotFoundException();
  }

  @Get()
  findAll() {
    throw new NotFoundException();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    throw new NotFoundException();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    throw new NotFoundException();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    throw new NotFoundException();
  }
}
