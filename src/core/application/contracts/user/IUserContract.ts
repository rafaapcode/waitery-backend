import { Organization } from 'src/core/domain/entities/organization';
import { User, UserRole } from 'src/core/domain/entities/user';

export interface IUserContract {
  create(
    params: IUserContract.CreateParams,
  ): Promise<IUserContract.CreateOutput>;

  update(
    params: IUserContract.UpdateParams,
  ): Promise<IUserContract.UpdateOutput>;

  updateMe(
    params: IUserContract.UpdateMeParams,
  ): Promise<IUserContract.UpdateMeOutput>;

  delete(
    params: IUserContract.DeleteParams,
  ): Promise<IUserContract.DeleteOutput>;

  getAll(
    params: IUserContract.GetAllParams,
  ): Promise<IUserContract.GetAllOutput>;

  getMe(params: IUserContract.GetMeParams): Promise<IUserContract.GetMeOutput>;

  get(params: IUserContract.GetParams): Promise<IUserContract.GetOutput>;

  getuserByEmail(
    params: IUserContract.GetUserByEmailParams,
  ): Promise<IUserContract.GetUserByEmailOutput>;

  getuserByCpf(
    params: IUserContract.GetUserByCpfParams,
  ): Promise<IUserContract.GetUserByCpfOutput>;

  getOrgs(
    params: IUserContract.GetOrgsParams,
  ): Promise<IUserContract.GetOrgsOutput>;
}

export namespace IUserContract {
  export type CreateParams = {
    org_id: string;
    data: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      cpf: string;
    };
  };
  export type CreateOutput = User;

  export type UpdateParams = {
    id: string;
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      cpf?: string;
    };
  };
  export type UpdateOutput = User;

  export type UpdateMeParams = {
    id: string;
    data: {
      name?: string;
      email?: string;
      password?: string;
      new_password?: string;
    };
  };
  export type UpdateMeOutput = User;

  export type DeleteParams = {
    id: string;
  };
  export type DeleteOutput = void;

  export type GetAllParams = {
    org_id: string;
    owner_id: string;
    page: number;
  };
  export type GetAllOutput = {
    users: User[];
    has_next: boolean;
  };

  export type GetMeParams = {
    id: string;
  };
  export type GetMeOutput = User | null;

  export type GetParams = {
    id: string;
  };
  export type GetOutput = User | null;

  export type GetUserByEmailParams = {
    email: string;
  };
  export type GetUserByEmailOutput = User | null;

  export type GetUserByCpfParams = {
    cpf: string;
  };
  export type GetUserByCpfOutput = User | null;

  export type GetOrgsParams = {
    owner_id: string;
  };
  export type GetOrgsOutput = Organization[];
}
