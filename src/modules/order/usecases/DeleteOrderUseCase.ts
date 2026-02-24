import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IORDER_CONTRACT, IORGANIZATION_CONTRACT } from 'src/shared/constants';

interface IDeleteOrderUseCase {
  execute(order_id: string, org_id: string): Promise<void>;
}

@Injectable()
export class DeleteOrderUseCase implements IDeleteOrderUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgContract: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(order_id: string, org_id: string): Promise<void> {
    const className = DeleteOrderUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando exclusão do pedido '${order_id}' para organização '${org_id}'.`,
    );
    try {
      const orgExists = await this.orgContract.get({ id: org_id });
      if (!orgExists) {
        this.observabilityService.warn(
          className,
          `Organização '${org_id}' não encontrada ao excluir pedido '${order_id}'.`,
        );
        throw new NotFoundException('Organization not found');
      }
      const order = await this.orderContract.getOrder(order_id);
      if (!order) {
        this.observabilityService.warn(
          className,
          `Pedido '${order_id}' não encontrado para exclusão na organização '${org_id}'.`,
        );
        throw new NotFoundException('Order not found');
      }
      const orgIsLinkedWithOrder = order.org_id === org_id;
      if (!orgIsLinkedWithOrder) {
        this.observabilityService.warn(
          className,
          `Pedido '${order_id}' não está vinculado à organização '${org_id}'.`,
        );
        throw new ConflictException('Order is not linked with the org');
      }
      await this.orderContract.deleteOrder(order_id);
      this.observabilityService.log(
        className,
        `Pedido '${order_id}' excluído com sucesso da organização '${org_id}'.`,
      );
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao excluir pedido '${order_id}' da organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
