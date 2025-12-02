import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { GetMe } from 'src/common/decorators/GetMe';
import { GetOrgId } from 'src/common/decorators/GetOrgId';
import { Roles } from 'src/common/decorators/Role';
import { ParseULIDPipe } from 'src/common/pipes/ParseULIDPipe';
import { UserRole } from 'src/core/domain/entities/user';
import { JwtPayload } from 'src/express';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductUseCase } from './usecases/CreateProductUseCase';
import { DeleteProductUseCase } from './usecases/DeleteProductUseCase';
import { GetAllProductUseCase } from './usecases/GetAllProductsUseCase';
import { GetProductByCategoryUseCase } from './usecases/GetProductByCategoryUseCase';
import { GetProductUseCase } from './usecases/GetProductUseCase';
import { UpdateProductUseCase } from './usecases/UpdateProductUseCase';

@Controller('product')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly getAllProductsProductUseCase: GetAllProductUseCase,
    private readonly GetProductProductUseCase: GetProductUseCase,
    private readonly getProductByCategoryProductUseCase: GetProductByCategoryUseCase,
  ) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post()
  create(@Body() data: CreateProductDto, @GetOrgId() org_id: string) {
    return this.createProductUseCase.execute(data, org_id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Put(':product_id')
  async update(
    @GetOrgId() org_id: string,
    @Param('product_id', ParseULIDPipe) product_id: string,
    @Body() data: UpdateProductDto,
  ) {
    await this.updateProductUseCase.execute(org_id, product_id, data);
    return { message: 'Product updated successfully' };
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':product_id')
  async delete(
    @GetMe() me: JwtPayload,
    @GetOrgId() org_id: string,
    @Param('product_id', ParseULIDPipe) product_id: string,
  ) {
    await this.deleteProductUseCase.execute(
      product_id,
      org_id,
      me.id,
      me.role as UserRole,
    );
    return { message: 'Product deleted successfully' };
  }

  @Get('all/:page')
  all(@GetOrgId() org_id: string, @Param('page', ParseIntPipe) page?: number) {
    return this.getAllProductsProductUseCase.execute(org_id, page);
  }

  @Get('category/:category_id/:page')
  getByCategory(
    @GetOrgId() org_id: string,
    @Param('category_id', ParseULIDPipe) category_id: string,
    @Param('page', ParseIntPipe) page?: number,
  ) {
    return this.getProductByCategoryProductUseCase.execute(
      org_id,
      category_id,
      page,
    );
  }

  @Get(':product_id')
  getProduct(
    @GetOrgId() org_id: string,
    @Param('product_id', ParseULIDPipe) product_id: string,
  ) {
    return this.GetProductProductUseCase.execute(org_id, product_id);
  }
}
