import { Inject, Injectable } from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { User } from 'src/core/domain/entities/user';
import { IUSER_CONTRACT } from 'src/shared/constants';

type GetAllUserInput = {
  org_id: string;
  page: number;
  owner_id: string;
};

interface IGetAllUserUseCase {
  execute(data: GetAllUserInput): Promise<{
    users: User[];
    has_next: boolean;
  }>;
}

@Injectable()
export class GetAllUserUseCase implements IGetAllUserUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
  ) {}

  async execute({ org_id, page, owner_id }: GetAllUserInput): Promise<{
    users: User[];
    has_next: boolean;
  }> {
    return await this.userContract.getAll({
      owner_id,
      org_id,
      page,
    });
  }
}
