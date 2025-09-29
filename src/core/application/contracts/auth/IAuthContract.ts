import { User } from 'src/core/domain/entities/user';

export interface IAuthContract {
  signIn: (
    data: IAuthContract.SignInParams,
  ) => Promise<IAuthContract.SignInOutput>;
  signUp: (
    data: IAuthContract.SignUpParams,
  ) => Promise<IAuthContract.SignUpOutput>;
}

export namespace IAuthContract {
  export type SignInParams = {
    email: string;
    password: string;
  };
  export type SignInOutput = { user: User; access_token: string };

  export type SignUpParams = {
    name: string;
    email: string;
    password: string;
    cpf: string;
  };
  export type SignUpOutput = { user: User; access_token: string };
}
