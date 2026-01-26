import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { UserRole } from 'src/core/domain/entities/user';
import { IUSER_CONTRACT } from 'src/shared/constants';

interface IUpdateUserUseCase {
  execute(
    params: IUserContract.UpdateParams,
  ): Promise<IUserContract.UpdateOutput>;
}

@Injectable()
export class UpdateUserUseCase implements IUpdateUserUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
  ) {}

  async execute({
    data,
    id,
  }: IUserContract.UpdateParams): Promise<IUserContract.UpdateOutput> {
    const user = await this.userContract.get({ id });

    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.OWNER) {
      throw new ConflictException('Cannot update owner user');
    }

    if (data.email) {
      const userByEmail = await this.userContract.getuserByEmail({
        email: data.email,
      });
      if (userByEmail)
        throw new ConflictException('User with email already exists');
    }
    const userUpdated = await this.userContract.update({ id, data });

    return userUpdated;
  }
}
