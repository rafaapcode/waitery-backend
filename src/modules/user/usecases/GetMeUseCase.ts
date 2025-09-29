import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { User } from 'src/core/domain/entities/user';
import { IUSER_CONTRACT } from 'src/shared/constants';

interface IGetMeUseCase {
  execute(id: string): Promise<User>;
}

@Injectable()
export class GetMeUseCase implements IGetMeUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
  ) {}

  async execute(id: string): Promise<User> {
    const user = await this.userContract.getMe({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
