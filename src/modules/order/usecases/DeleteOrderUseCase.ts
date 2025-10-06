import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
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
  ) {}

  async execute(order_id: string, org_id: string): Promise<void> {
    const orgExists = await this.orgContract.get({ id: org_id });

    if (!orgExists) {
      throw new NotFoundException('Organization not found');
    }

    const orgIsLinkedWithOrder = await this.orderContract.verifyOrderByOrg({
      order_id,
      org_id,
    });

    if (!orgIsLinkedWithOrder) {
      throw new ConflictException('Order is not linked with the org');
    }

    await this.orderContract.deleteOrder(order_id);
  }
}
