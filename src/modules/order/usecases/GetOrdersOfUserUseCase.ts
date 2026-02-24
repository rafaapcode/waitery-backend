import { Inject, Injectable } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { Order } from 'src/core/domain/entities/order';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IORDER_CONTRACT } from 'src/shared/constants';

interface IGetOrdersOfUserUseCase {
  execute(params: { user_id: string; page?: number }): Promise<{
    has_next: boolean;
    orders: Order[];
  }>;
}

@Injectable()
export class GetOrdersOfUserUseCase implements IGetOrdersOfUserUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(params: { user_id: string; page?: number }): Promise<{
    has_next: boolean;
    orders: Order[];
  }> {
    const className = GetOrdersOfUserUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca dos pedidos do usuário '${params.user_id}', page: '${params.page}'.`,
    );
    try {
      const orders = await this.orderContract.getOrderOfUser(params);
      this.observabilityService.log(
        className,
        `Pedidos encontrados: ${orders.orders.length}, has_next: ${orders.has_next} para usuário '${params.user_id}'.`,
      );
      return orders;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar pedidos do usuário '${params.user_id}'.`,
        '',
      );
      throw error;
    }
  }
}
