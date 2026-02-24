import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { Product } from 'src/core/domain/entities/product';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import {
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';

interface IGetProductUseCase {
  execute(org_id: string, product_id: string): Promise<Product>;
}

@Injectable()
export class GetProductUseCase implements IGetProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(org_id: string, product_id: string): Promise<Product> {
    const className = GetProductUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca do produto '${product_id}' para organização '${org_id}'.`,
    );
    try {
      const orgExists = await this.orgService.get({ id: org_id });
      if (!orgExists) {
        this.observabilityService.warn(
          className,
          `Organização '${org_id}' não encontrada ao buscar produto '${product_id}'.`,
        );
        throw new NotFoundException('Organization not found');
      }
      const product = await this.prodService.get({
        product_id,
        org_id,
      });
      if (!product) {
        this.observabilityService.warn(
          className,
          `Produto '${product_id}' não encontrado na organização '${org_id}'.`,
        );
        throw new NotFoundException('Product not found');
      }
      this.observabilityService.log(
        className,
        `Produto '${product_id}' encontrado na organização '${org_id}'.`,
      );
      return product;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar produto '${product_id}' na organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
