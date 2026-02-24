import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { Order } from 'src/core/domain/entities/order';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IORDER_CONTRACT } from 'src/shared/constants';

interface IGetOrderUseCase {
  execute(order_id: string, org_id: string): Promise<Order>;
}

@Injectable()
export class GetOrderUseCase implements IGetOrderUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(order_id: string, org_id: string): Promise<Order> {
    const className = GetOrderUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca do pedido '${order_id}' para organização '${org_id}'.`,
    );
    try {
      const orderExists = await this.orderContract.getOrder(order_id);
      if (!orderExists) {
        this.observabilityService.warn(
          className,
          `Pedido '${order_id}' não encontrado para organização '${org_id}'.`,
        );
        throw new NotFoundException('Order not found');
      }
      const orgHasOrder = orderExists.org_id === org_id;
      if (!orgHasOrder) {
        this.observabilityService.warn(
          className,
          `Pedido '${order_id}' não pertence à organização '${org_id}'.`,
        );
        throw new NotFoundException('Orders is not from this org');
      }
      const order = await this.orderContract.getOrder(order_id);
      if (!order) {
        this.observabilityService.warn(
          className,
          `Pedido '${order_id}' não encontrado após validação para organização '${org_id}'.`,
        );
        throw new NotFoundException('Order not found');
      }
      this.observabilityService.log(
        className,
        `Pedido '${order_id}' encontrado para organização '${org_id}'.`,
      );
      return order;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar pedido '${order_id}' para organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
