import { Inject, Injectable } from '@nestjs/common';
import { IAuthContract } from 'src/core/application/contracts/auth/IAuthContract';
import { IAUTH_CONTRACT } from 'src/shared/constants';

interface ISignInUseCase {
  execute(
    data: IAuthContract.SignInParams,
    user_agent: string,
    ip_address: string,
  ): Promise<IAuthContract.SignInOutput>;
}

@Injectable()
export class SignInUseCase implements ISignInUseCase {
  constructor(
    @Inject(IAUTH_CONTRACT) private readonly authService: IAuthContract,
  ) {}

  async execute(
    data: IAuthContract.SignInParams,
    user_agent: string,
    ip_address: string,
  ): Promise<IAuthContract.SignInOutput> {
    const user = await this.authService.signIn(data, user_agent, ip_address);
    return user;
  }
}
