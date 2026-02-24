import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { Product } from 'src/core/domain/entities/product';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import {
  ICATEGORY_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';

interface IGetProductByCategoryUseCase {
  execute(
    org_id: string,
    category_id: string,
    page?: number,
  ): Promise<{
    has_next: boolean;
    products: Product[];
  }>;
}

@Injectable()
export class GetProductByCategoryUseCase implements IGetProductByCategoryUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(ICATEGORY_CONTRACT)
    private readonly catService: ICategoryContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(
    org_id: string,
    category_id: string,
    page?: number,
  ): Promise<{
    has_next: boolean;
    products: Product[];
  }> {
    const className = GetProductByCategoryUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca de produtos por categoria '${category_id}' para organização '${org_id}', page: '${page}'.`,
    );
    try {
      const org_exists = await this.orgService.get({ id: org_id });
      if (!org_exists) {
        this.observabilityService.warn(
          className,
          `Organização '${org_id}' não encontrada ao buscar produtos por categoria '${category_id}'.`,
        );
        throw new NotFoundException('Organization not found');
      }
      const cat_exists = await this.catService.getCategory({
        id: category_id,
        orgId: org_id,
      });
      if (!cat_exists) {
        this.observabilityService.warn(
          className,
          `Categoria '${category_id}' não encontrada ao buscar produtos na organização '${org_id}'.`,
        );
        throw new NotFoundException('Category not found');
      }
      const isRelated = cat_exists.org_id === org_id;
      if (!isRelated) {
        this.observabilityService.warn(
          className,
          `Categoria '${category_id}' não pertence à organização '${org_id}'.`,
        );
        throw new NotFoundException('Category not found');
      }
      const products = await this.prodService.getProductsByCategory({
        org_id,
        category_id,
        page,
      });
      this.observabilityService.log(
        className,
        `Produtos encontrados: ${products.products.length}, has_next: ${products.has_next} para categoria '${category_id}' na organização '${org_id}'.`,
      );
      return products;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar produtos por categoria '${category_id}' na organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
