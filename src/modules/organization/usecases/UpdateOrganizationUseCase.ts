import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Organization } from 'src/core/domain/entities/organization';
import { IORGANIZATION_CONTRACT } from 'src/shared/constants';
import { UpdateOrganizationDTO } from '../dto/update-organization.dto';

interface IUpdateOrganizationUseCase {
  execute(
    id: string,
    owner_id: string,
    data: UpdateOrganizationDTO,
  ): Promise<Organization>;
}

@Injectable()
export class UpdateOrganizationUseCase implements IUpdateOrganizationUseCase {
  constructor(
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
  ) {}

  async execute(
    id: string,
    owner_id: string,
    data: UpdateOrganizationDTO,
  ): Promise<Organization> {
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

    const org_updated = await this.orgService.update({ id, data });

    return org_updated;
  }
}
