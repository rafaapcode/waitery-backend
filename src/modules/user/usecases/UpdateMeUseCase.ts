import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { COMPARE_HASH, IUSER_CONTRACT } from 'src/shared/constants';

type CompareFn = (hashPwd: string, pwd: string) => Promise<boolean>;

interface IUpdateMeUseCase {
  execute(
    params: IUserContract.UpdateMeParams,
  ): Promise<IUserContract.UpdateMeOutput>;
}

@Injectable()
export class UpdateMeUseCase implements IUpdateMeUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
    @Inject(COMPARE_HASH) private readonly compareHash: CompareFn,
  ) {}

  async execute({
    data,
    id,
  }: IUserContract.UpdateMeParams): Promise<IUserContract.UpdateMeOutput> {
    const user = await this.userContract.getMe({ id });

    if (!user) throw new NotFoundException('User not found');

    if (data.email) {
      const userByEmail = await this.userContract.getuserByEmail({
        email: data.email,
      });
      if (userByEmail)
        throw new ConflictException('User with email already exists');
    }

    if (data.new_password && !data.password) {
      throw new BadRequestException('Invalid credentials');
    }

    if (data.new_password && data.password) {
      const currentPwdIsValid = await this.validateHash(
        user.password!,
        data.password,
      );
      if (!currentPwdIsValid) {
        throw new BadRequestException('Invalid credentials');
      }
    }

    const userUpdated = await this.userContract.updateMe({ id, data });

    return userUpdated;
  }

  private async validateHash(hashPwd: string, pwd: string): Promise<boolean> {
    return await this.compareHash(hashPwd, pwd);
  }
}
