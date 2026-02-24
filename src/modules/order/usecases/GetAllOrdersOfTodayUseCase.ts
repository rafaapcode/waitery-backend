import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Order } from 'src/core/domain/entities/order';
import { UserRole } from 'src/core/domain/entities/user';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IORDER_CONTRACT, IORGANIZATION_CONTRACT } from 'src/shared/constants';

interface IGetAllOrdersOfTodayUseCase {
  execute(
    owner_id: string,
    role: UserRole,
    org_id: string,
    filters: { canceled_orders: boolean },
  ): Promise<Order[]>;
}

@Injectable()
export class GetAllOrdersOfTodayUseCase implements IGetAllOrdersOfTodayUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgContract: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(
    owner_id: string,
    role: UserRole,
    org_id: string,
    filters: { canceled_orders: boolean },
  ): Promise<Order[]> {
    const className = GetAllOrdersOfTodayUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca de pedidos do dia para organização '${org_id}', owner_id: '${owner_id}', role: '${role}', filtros: '${JSON.stringify(filters)}'.`,
    );
    try {
      const org_exists = await this.orgContract.get({
        id: org_id,
      });
      if (!org_exists) {
        this.observabilityService.warn(
          className,
          `Organização '${org_id}' não encontrada ao buscar pedidos do dia.`,
        );
        throw new NotFoundException('Org not found');
      }
      if (role === UserRole.OWNER) {
        const isOwnerValid = await this.orgContract.verifyOrgById({
          org_id,
          owner_id,
        });
        if (!isOwnerValid) {
          this.observabilityService.warn(
            className,
            `Owner '${owner_id}' inválido para organização '${org_id}'.`,
          );
          throw new ConflictException('Owner is invalid');
        }
      }
      const orders = await this.orderContract.getAllOrdersOfToday({
        org_id,
        orders_canceled: filters.canceled_orders,
      });
      this.observabilityService.log(
        className,
        `Pedidos do dia encontrados: ${orders.length} para organização '${org_id}'.`,
      );
      return orders;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar pedidos do dia para organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
