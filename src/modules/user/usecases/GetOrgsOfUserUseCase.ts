import { Inject, Injectable } from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { Organization } from 'src/core/domain/entities/organization';
import { IUSER_CONTRACT } from 'src/shared/constants';

interface IGetOrgsOfUserUseCase {
  execute(id: string): Promise<Organization[]>;
}

@Injectable()
export class GetOrgsOfUserUseCase implements IGetOrgsOfUserUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
  ) {}

  async execute(id: string): Promise<Organization[]> {
    const org = await this.userContract.getOrgs({ owner_id: id });

    return org;
  }
}
