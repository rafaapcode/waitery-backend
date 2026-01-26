import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
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

@Controller('products')
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
  @UseInterceptors(FileInterceptor('image'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: string,
    @GetOrgId() org_id: string,
  ) {
    const parsedData = plainToInstance(CreateProductDto, data);
    return this.createProductUseCase.execute(parsedData, org_id, file);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Put(':product_id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @GetOrgId() org_id: string,
    @Param('product_id', ParseULIDPipe) product_id: string,
    @Body() data: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const parsedData = plainToInstance(UpdateProductDto, data);
    await this.updateProductUseCase.execute(
      org_id,
      product_id,
      parsedData,
      file,
    );
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
