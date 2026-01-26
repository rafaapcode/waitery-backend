import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { UserRole } from 'src/core/domain/entities/user';
import { IUSER_CONTRACT } from 'src/shared/constants';

interface IDeleteUserUseCase {
  execute(id: string): Promise<void>;
}

@Injectable()
export class DeleteUserUseCase implements IDeleteUserUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.userContract.get({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.OWNER) {
      throw new ConflictException('Cannot delete owner user');
    }

    await this.userContract.delete({ id });
  }
}
