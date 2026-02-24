import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import {
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';

interface IAddDiscountToAProductUseCase {
  execute(
    org_id: string,
    product_id: string,
    discounted_price: number,
  ): Promise<void>;
}

@Injectable()
export class AddDiscountToProductUseCase implements IAddDiscountToAProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(
    org_id: string,
    product_id: string,
    discounted_price: number,
  ): Promise<void> {
    const className = AddDiscountToProductUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando adição de desconto ao produto '${product_id}' na organização '${org_id}'. Valor do desconto: '${discounted_price}'.`,
    );
    try {
      const orgExists = await this.orgService.get({ id: org_id });
      if (!orgExists) {
        this.observabilityService.warn(
          className,
          `Organização '${org_id}' não encontrada ao adicionar desconto ao produto '${product_id}'.`,
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
          `Produto '${product_id}' não encontrado na organização '${org_id}' ao adicionar desconto.`,
        );
        throw new NotFoundException('Product not found');
      }
      await this.prodService.addDiscount({
        discounted_price,
        org_id,
        product_id,
      });
      this.observabilityService.log(
        className,
        `Desconto de '${discounted_price}' adicionado ao produto '${product_id}' na organização '${org_id}'.`,
      );
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao adicionar desconto ao produto '${product_id}' na organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
