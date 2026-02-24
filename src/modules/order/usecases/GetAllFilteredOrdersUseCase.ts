import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Order, OrderStatus } from 'src/core/domain/entities/order';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IORDER_CONTRACT, IORGANIZATION_CONTRACT } from 'src/shared/constants';

interface IGetAllFilteredOrdersOfOrgUseCase {
  execute(params: {
    org_id: string;
    page?: number;
    filters?: { status?: OrderStatus; table?: string };
  }): Promise<{
    has_next: boolean;
    orders: Order[];
  }>;
}

@Injectable()
export class GetAllFilteredOrdersOfOrgUseCase implements IGetAllFilteredOrdersOfOrgUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgContract: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(params: {
    org_id: string;
    page?: number;
    filters?: { status?: OrderStatus; table?: string };
  }): Promise<{
    has_next: boolean;
    orders: Order[];
  }> {
    const className = GetAllFilteredOrdersOfOrgUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca de pedidos filtrados para organização '${params.org_id}', page: '${params.page}', filters: '${JSON.stringify(params.filters)}'.`,
    );
    try {
      const orgExists = await this.orgContract.get({ id: params.org_id });
      if (!orgExists) {
        this.observabilityService.warn(
          className,
          `Organização '${params.org_id}' não encontrada ao buscar pedidos filtrados.`,
        );
        throw new NotFoundException('Org not found');
      }
      const orders = await this.orderContract.getAllOrdersFilteredBy(params);
      this.observabilityService.log(
        className,
        `Pedidos encontrados: ${orders.orders.length}, has_next: ${orders.has_next} para organização '${params.org_id}'.`,
      );
      return orders;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar pedidos filtrados para organização '${params.org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
