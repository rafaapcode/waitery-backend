import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IORGANIZATION_CONTRACT } from 'src/shared/constants';

interface IDeleteOrganizationUseCase {
  execute(id: string, owner_id: string): Promise<void>;
}

@Injectable()
export class DeleteOrganizationUseCase implements IDeleteOrganizationUseCase {
  constructor(
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
  ) {}

  async execute(id: string, owner_id: string): Promise<void> {
    const user_has_org = await this.orgService.verifyOrgById({
      org_id: id,
      owner_id,
    });

    if (!user_has_org) {
      throw new NotFoundException('Organization Not Found');
    }

    const org = await this.orgService.get({ id });

    if (!org) {
      throw new NotFoundException('Organization Not Found');
    }

    await this.orgService.delete({ id });
  }
}
