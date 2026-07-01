import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IORDER_CONTRACT } from 'src/shared/constants';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';

interface IUpdateOrderStatusUseCase {
  execute(
    data: UpdateOrderStatusDto,
    org_id: string,
    order_id: string,
  ): Promise<void>;
}

@Injectable()
export class UpdateOrderStatusUseCase implements IUpdateOrderStatusUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(
    data: UpdateOrderStatusDto,
    org_id: string,
    order_id: string,
  ): Promise<void> {
    const className = UpdateOrderStatusUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando atualização de status do pedido '${order_id}' para organização '${org_id}'. Novo status: '${data.status}'.`,
    );
    try {
      const order = await this.orderContract.getOrder(order_id);
      if (!order) {
        this.observabilityService.warn(
          className,
          `Pedido '${order_id}' não encontrado após validação para organização '${org_id}'.`,
        );
        throw new NotFoundException('Order not found');
      }
      const orgHasOrder = order.org_id === org_id;
      if (!orgHasOrder) {
        this.observabilityService.warn(
          className,
          `Pedido '${order_id}' não pertence à organização '${org_id}'.`,
        );
        throw new NotFoundException('Order not found');
      }
      if (order.status === data.status) {
        this.observabilityService.warn(
          className,
          `Status do pedido '${order_id}' já é '${data.status}' para organização '${org_id}'.`,
        );
        throw new ConflictException(
          'The new status must be different from the actual status',
        );
      }
      await this.orderContract.updateOrderStatus({ ...data, order_id });
      this.observabilityService.log(
        className,
        `Status do pedido '${order_id}' atualizado para '${data.status}' na organização '${org_id}'.`,
      );
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao atualizar status do pedido '${order_id}' para organização '${org_id}'.`,
        error as Error,
      );
      throw error;
    }
  }
}
