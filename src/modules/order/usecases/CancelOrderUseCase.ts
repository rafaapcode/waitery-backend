import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IORDER_CONTRACT } from 'src/shared/constants';

interface ICancelOrderUseCase {
  execute(order_id: string, org_id: string): Promise<void>;
}

@Injectable()
export class CancelOrderUseCase implements ICancelOrderUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(order_id: string, org_id: string): Promise<void> {
    const className = CancelOrderUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando cancelamento do pedido '${order_id}' para organização '${org_id}'.`,
    );
    try {
      const order = await this.orderContract.getOrder(order_id);
      if (!order) {
        this.observabilityService.warn(
          className,
          `Pedido '${order_id}' não encontrado para organização '${org_id}'.`,
        );
        throw new NotFoundException('Order not found');
      }
      const orderIsLinkedWithOrg = order.org_id === org_id;
      if (!orderIsLinkedWithOrg) {
        this.observabilityService.warn(
          className,
          `Pedido '${order_id}' não pertence à organização '${org_id}'.`,
        );
        throw new NotFoundException('Order is not from this org');
      }
      await this.orderContract.cancelOrder(order_id);
      this.observabilityService.log(
        className,
        `Pedido '${order_id}' cancelado com sucesso para organização '${org_id}'.`,
      );
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao cancelar pedido '${order_id}' para organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
