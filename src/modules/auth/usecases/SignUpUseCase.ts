import { Inject, Injectable } from '@nestjs/common';
import { IAuthContract } from 'src/core/application/contracts/auth/IAuthContract';
import { IAUTH_CONTRACT } from 'src/shared/constants';

interface ISignUpUseCase {
  execute(
    data: IAuthContract.SignUpParams,
    user_agent: string,
    ip_address: string,
  ): Promise<IAuthContract.SignUpOutput>;
}

@Injectable()
export class SignUpUseCase implements ISignUpUseCase {
  constructor(
    @Inject(IAUTH_CONTRACT) private readonly authService: IAuthContract,
  ) {}

  async execute(
    data: IAuthContract.SignUpParams,
    user_agent: string,
    ip_address: string,
  ): Promise<IAuthContract.SignUpOutput> {
    const user = await this.authService.signUp(data, user_agent, ip_address);
    return user;
  }
}
