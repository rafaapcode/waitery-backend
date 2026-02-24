import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import {
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';

interface IRemoveDiscountToAProductUseCase {
  execute(
    org_id: string,
    product_id: string,
    discounted_price: number,
  ): Promise<void>;
}

@Injectable()
export class RemoveDiscountToProductUseCase implements IRemoveDiscountToAProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(org_id: string, product_id: string): Promise<void> {
    const className = RemoveDiscountToProductUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando remoção de desconto do produto '${product_id}' na organização '${org_id}'.`,
    );
    try {
      const orgExists = await this.orgService.get({ id: org_id });
      if (!orgExists) {
        this.observabilityService.warn(
          className,
          `Organização '${org_id}' não encontrada ao remover desconto do produto '${product_id}'.`,
        );
        throw new NotFoundException('Organization not found');
      }
      const productExists = await this.prodService.get({
        product_id,
        org_id,
      });
      if (!productExists) {
        this.observabilityService.warn(
          className,
          `Produto '${product_id}' não encontrado na organização '${org_id}' ao remover desconto.`,
        );
        throw new NotFoundException('Product not found');
      }

      await this.prodService.removeDiscount({
        org_id,
        product_id,
      });

      this.observabilityService.log(
        className,
        `Desconto removido do produto '${product_id}' na organização '${org_id}'.`,
      );
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao remover desconto do produto '${product_id}' na organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
