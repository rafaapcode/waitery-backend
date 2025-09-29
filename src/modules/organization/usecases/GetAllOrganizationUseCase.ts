import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Organization } from 'src/core/domain/entities/organization';
import { IORGANIZATION_CONTRACT } from 'src/shared/constants';

interface IGetAllOrganizationUseCase {
  execute(owner_id: string): Promise<Organization[]>;
}

@Injectable()
export class GetAllOrganizationUseCase implements IGetAllOrganizationUseCase {
  constructor(
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
  ) {}

  async execute(owner_id: string): Promise<Organization[]> {
    const org = await this.orgService.getAll({ owner_id });

    if (!org || org.length === 0) {
      throw new NotFoundException('Organizations was Not Found');
    }

    return org;
  }
}
