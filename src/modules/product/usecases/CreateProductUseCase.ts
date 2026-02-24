import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { createProductEntity, Product } from 'src/core/domain/entities/product';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import {
  ICATEGORY_CONTRACT,
  IINGREDIENT_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';
import { CreateProductDto } from '../dto/create-product.dto';

interface ICreateProductUseCase {
  execute(
    product: CreateProductDto,
    org_id: string,
    file?: Express.Multer.File,
  ): Promise<Product>;
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
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(
    data: CreateProductDto,
    org_id: string,
    file?: Express.Multer.File,
  ): Promise<Product> {
    const className = CreateProductUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando criação de produto '${data.name}' na organização '${org_id}'.`,
    );
    try {
      const org = await this.orgService.get({
        id: org_id,
      });
      if (!org) {
        this.observabilityService.warn(
          className,
          `Organização '${org_id}' não encontrada ao criar produto '${data.name}'.`,
        );
        throw new NotFoundException('Organization not found');
      }
      const productAlreadyExists = await this.prodService.getProductByName({
        name: data.name,
        org_id,
      });
      if (productAlreadyExists) {
        this.observabilityService.warn(
          className,
          `Produto '${data.name}' já existe na organização '${org_id}'.`,
        );
        throw new ConflictException(
          'Product with this name already exists in this organization',
        );
      }
      const category = await this.catService.getCategory({
        id: data.category_id,
        orgId: org_id,
      });
      if (!category) {
        this.observabilityService.warn(
          className,
          `Categoria '${data.category_id}' não encontrada ao criar produto '${data.name}' na organização '${org_id}'.`,
        );
        throw new NotFoundException('Category not found');
      }
      const ingredients = await this.ingService.getByManyByIds(
        data.ingredients,
      );
      if (
        !ingredients ||
        ingredients.length === 0 ||
        ingredients.length > data.ingredients.length
      ) {
        this.observabilityService.warn(
          className,
          `Ingredientes inválidos ao criar produto '${data.name}' na organização '${org_id}'.`,
        );
        throw new BadRequestException('Ingredients not found or invalid');
      }
      const productEntity = createProductEntity({
        category: category,
        description: data.description,
        image_url: '',
        ingredients: ingredients.reduce(
          (acc, curr) => {
            if (!acc.find((item) => item.value === curr.id)) {
              acc.push({ value: curr.id || '', label: curr.name });
            }
            return acc;
          },
          [] as { value: string; label: string }[],
        ),
        name: data.name,
        org_id,
        price: data.price,
      });
      if (file) {
        await this.prodService.uploadFile({
          file,
          product: productEntity,
        });
      }
      const product = await this.prodService.create(productEntity);
      this.observabilityService.log(
        className,
        `Produto '${data.name}' criado com sucesso na organização '${org_id}'.`,
      );
      return product;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao criar produto '${data.name}' na organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
