import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { Product } from 'src/core/domain/entities/product';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import {
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';

interface IGetAllProductUseCase {
  execute(
    org_id: string,
    page?: number,
  ): Promise<{
    has_next: boolean;
    products: Product[];
  }>;
}

@Injectable()
export class GetAllProductUseCase implements IGetAllProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(
    org_id: string,
    page?: number,
  ): Promise<{
    has_next: boolean;
    products: Product[];
  }> {
    const className = GetAllProductUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca de todos os produtos para organização '${org_id}', page: '${page}'.`,
    );
    try {
      const org_exists = await this.orgService.get({ id: org_id });
      if (!org_exists) {
        this.observabilityService.warn(
          className,
          `Organização '${org_id}' não encontrada ao buscar todos os produtos.`,
        );
        throw new NotFoundException('Organization not found');
      }
      const products = await this.prodService.getAll({
        org_id,
        page,
      });
      this.observabilityService.log(
        className,
        `Produtos encontrados: ${products.products.length}, has_next: ${products.has_next} para organização '${org_id}'.`,
      );
      return products;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar todos os produtos para organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
