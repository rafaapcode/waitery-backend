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
  ) {}

  async execute(
    owner_id: string,
    role: UserRole,
    org_id: string,
    filters: { canceled_orders: boolean },
  ): Promise<Order[]> {
    const org_exists = await this.orgContract.get({
      id: org_id,
    });

    if (!org_exists) {
      throw new NotFoundException('Org not found');
    }

    if (role === UserRole.OWNER) {
      const isOwnerValid = await this.orgContract.verifyOrgById({
        org_id,
        owner_id,
      });

      if (!isOwnerValid) {
        throw new ConflictException('Owner is invalid');
      }
    }

    const orders = await this.orderContract.getAllOrdersOfToday({
      org_id,
      orders_canceled: filters.canceled_orders,
    });

    return orders;
  }
}
