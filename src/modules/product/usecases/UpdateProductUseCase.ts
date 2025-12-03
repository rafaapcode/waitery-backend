import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import {
  IINGREDIENT_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';
import { UpdateProductDto } from '../dto/update-product.dto';

interface IUpdateProductUseCase {
  execute(
    org_id: string,
    product_id: string,
    data: UpdateProductDto,
  ): Promise<void>;
}

@Injectable()
export class UpdateProductUseCase implements IUpdateProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingService: IIngredientContract,
  ) {}

  async execute(
    org_id: string,
    product_id: string,
    data: UpdateProductDto,
  ): Promise<void> {
    const orgExists = await this.orgService.get({ id: org_id });

    if (!orgExists) throw new NotFoundException('Organization not found');

    const productExists = await this.prodService.get({
      product_id,
      org_id,
    });

    if (!productExists) throw new NotFoundException('Product not found');

    let ingredients: Ingredient[] = [];
    if (data.ingredients && data.ingredients.length > 0) {
      ingredients = await this.ingService.getByManyByIds(data.ingredients);

      if (
        !ingredients ||
        ingredients.length === 0 ||
        ingredients.length > data.ingredients.length
      ) {
        throw new BadRequestException('Ingredients not found or invalid');
      }
    }
    await this.prodService.update({
      id: product_id,
      data: {
        ...(data.description && { description: data.description }),
        ...(data.name && { name: data.name }),
        ...(data.price && { price: data.price }),
        ...(ingredients.length > 0 && {
          ingredients: ingredients.map((ing) => ({
            value: ing.id || '',
            label: ing.formatToString(),
          })),
        }),
      },
    });
  }
}
