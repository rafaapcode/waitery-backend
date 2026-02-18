import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IORGANIZATION_CONTRACT, IUSER_CONTRACT } from 'src/shared/constants';

interface IRemoveUserFromOrgUseCase {
  execute(
    org_ids: IUserContract.RemoveUserFromOrgParams,
  ): Promise<IUserContract.RemoveUserFromOrgOutput>;
}

@Injectable()
export class RemoveUserFromOrgUseCase implements IRemoveUserFromOrgUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly organizationContract: IOrganizationContract,
  ) {}

  async execute({
    org_ids,
    user_id,
  }: IUserContract.RemoveUserFromOrgParams): Promise<IUserContract.RemoveUserFromOrgOutput> {
    const user = await this.userContract.get({ id: user_id });

    if (!user) throw new NotFoundException('User not found');

    const orgs = await this.organizationContract.getAllByOrgId({ org_ids });

    if (!orgs || orgs.length === 0) {
      throw new NotFoundException('Organization not found');
    }

    await this.userContract.removeUserFromOrg({ user_id, org_ids });
  }
}
