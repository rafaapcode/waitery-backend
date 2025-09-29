import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Organization } from 'src/core/domain/entities/organization';
import { IORGANIZATION_CONTRACT } from 'src/shared/constants';

interface IGetOrganizationUseCase {
  execute(id: string, owner_id: string): Promise<Organization>;
}

@Injectable()
export class GetOrganizationUseCase implements IGetOrganizationUseCase {
  constructor(
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
  ) {}

  async execute(id: string, owner_id: string): Promise<Organization> {
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

    return org;
  }
}
