import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IORDER_CONTRACT, IORGANIZATION_CONTRACT } from 'src/shared/constants';

interface IRestartOrdersUseCase {
  execute(org_id: string): Promise<void>;
}

@Injectable()
export class RestartOrdersOfDayUseCase implements IRestartOrdersUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgContract: IOrganizationContract,
  ) {}

  async execute(org_id: string): Promise<void> {
    const orgExists = await this.orgContract.get({ id: org_id });

    if (!orgExists) {
      throw new NotFoundException('Organization not found');
    }

    await this.orderContract.restartsTheOrdersOfDay(org_id);
  }
}
