import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { createProductEntity, Product } from 'src/core/domain/entities/product';
import {
  ICATEGORY_CONTRACT,
  IINGREDIENT_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';
import { CreateProductDto } from '../dto/create-product.dto';

interface ICreateProductUseCase {
  execute(product: CreateProductDto): Promise<Product>;
}

@Injectable()
export class CreateProductUseCase implements ICreateProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(ICATEGORY_CONTRACT)
    private readonly catService: ICategoryContract,
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingService: IIngredientContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
  ) {}

  async execute(data: CreateProductDto): Promise<Product> {
    const org = await this.orgService.get({
      id: data.org_id,
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const category = await this.catService.getCategory(data.category_id);

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    const ingredients = await this.ingService.getByManyByIds(data.ingredients);

    if (
      !ingredients ||
      ingredients.length === 0 ||
      ingredients.length > data.ingredients.length
    ) {
      throw new BadRequestException('Ingredients not found or invalid');
    }

    const productEntity = createProductEntity({
      category: category,
      description: data.description,
      image_url: data.image_url,
      ingredients: ingredients.map((ing) => ing.formatToString()),
      name: data.name,
      org_id: data.org_id,
      price: data.price,
    });

    const product = await this.prodService.create(productEntity);

    return product;
  }
}
