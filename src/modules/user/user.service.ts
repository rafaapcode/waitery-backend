import { ConflictException, Injectable } from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { Organization } from 'src/core/domain/entities/organization';
import { User, UserRole } from 'src/core/domain/entities/user';
import { HashService } from 'src/hash.service';
import { UserRepo } from './repo/user.repository';

@Injectable()
export class UserService implements IUserContract {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly hashService: HashService,
  ) {}

  async create({
    org_id,
    data,
  }: IUserContract.CreateParams): Promise<IUserContract.CreateOutput> {
    const user = new User({
      cpf: data.cpf,
      email: data.email,
      name: data.name,
      role: UserRole[data.role],
      org_id: org_id,
    });

    user.password = await this.hashService.generateHash(data.password);

    const userCreated = await this.userRepo.create({
      ...user,
      password: user.password,
    });

    user.id = userCreated.id;

    await this.createRelationUserOrg(user.id, user.org_id!);

    return user;
  }

  async update({
    data,
    id,
  }: IUserContract.UpdateParams): Promise<IUserContract.UpdateOutput> {
    let hashPwd: string | undefined = undefined;

    if (data.password) {
      hashPwd = await this.hashService.generateHash(data.password);
    }

    const userUpdated = await this.userRepo.update({
      id,
      data: {
        ...data,
        ...(data.password && { password: hashPwd }),
      },
    });

    const user = new User({
      cpf: userUpdated.cpf,
      email: userUpdated.email,
      name: userUpdated.name ?? '',
      role: UserRole[userUpdated.role],
      id: userUpdated.id,
    });

    return user;
  }

  async updateMe({
    data,
    id,
  }: IUserContract.UpdateMeParams): Promise<IUserContract.UpdateMeOutput> {
    let hashPwd: string | undefined = undefined;

    if (data.new_password) {
      hashPwd = await this.hashService.generateHash(data.new_password);
    }

    const userUpdated = await this.userRepo.updateMe({
      id,
      data: {
        ...data,
        ...(data.new_password && { new_password: hashPwd }),
      },
    });

    const user = new User({
      cpf: userUpdated.cpf,
      email: userUpdated.email,
      name: userUpdated.name ?? '',
      role: UserRole[userUpdated.role],
      id: userUpdated.id,
    });

    return user;
  }

  async delete({
    id,
  }: IUserContract.DeleteParams): Promise<IUserContract.DeleteOutput> {
    await this.userRepo.delete({ id });
  }

  async getAll({
    org_id,
    page,
    owner_id,
  }: IUserContract.GetAllParams): Promise<IUserContract.GetAllOutput> {
    const userHasOrg = await this.userRepo.verifyOrgById(org_id, owner_id);

    if (!userHasOrg) {
      throw new ConflictException(
        'User is not associated with this organization',
      );
    }

    const LIMIT = 10;
    const OFFSET = LIMIT * (page < 0 ? 0 : page);
    let has_next = false;

    const users = await this.userRepo.getAll(org_id, OFFSET, LIMIT + 1);

    if (users.length > LIMIT) {
      has_next = true;
    }

    return {
      has_next,
      users: users.slice(0, LIMIT).map(
        (u) =>
          new User({
            ...u,
            name: u.name!,
            role: UserRole[u.role],
          }),
      ),
    };
  }

  async getMe({
    id,
  }: IUserContract.GetMeParams): Promise<IUserContract.GetMeOutput> {
    const user = await this.userRepo.getMe({ id });

    if (!user) return null;

    return new User({
      cpf: user.cpf,
      email: user.email,
      name: user.name!,
      role: UserRole[user?.role],
      password: user.password,
      id: user?.id,
    });
  }

  async get({ id }: IUserContract.GetParams): Promise<IUserContract.GetOutput> {
    const user = await this.userRepo.get({ id });

    if (!user) return null;

    return new User({
      cpf: user.cpf,
      email: user.email,
      name: user.name!,
      role: UserRole[user?.role],
      id: user?.id,
    });
  }

  async getuserByEmail({
    email,
  }: IUserContract.GetUserByEmailParams): Promise<IUserContract.GetUserByEmailOutput> {
    const user = await this.userRepo.getuserByEmail({ email });

    if (!user) return null;

    return new User({
      cpf: user.cpf,
      email: user.email,
      name: user.name!,
      role: UserRole[user?.role],
      id: user?.id,
    });
  }

  async getuserByCpf({
    cpf,
  }: IUserContract.GetUserByCpfParams): Promise<IUserContract.GetUserByCpfOutput> {
    const user = await this.userRepo.getuserByCpf({ cpf });

    if (!user) return null;

    return new User({
      cpf: user.cpf,
      email: user.email,
      name: user.name!,
      role: UserRole[user?.role],
      id: user?.id,
    });
  }

  async getOrgs({
    owner_id,
  }: IUserContract.GetOrgsParams): Promise<IUserContract.GetOrgsOutput> {
    const org = await this.userRepo.getUserOrgs({ owner_id });

    return org.map((org) => new Organization(org));
  }

  private async createRelationUserOrg(
    user_id: string,
    org_id: string,
  ): Promise<void> {
    await this.userRepo.createRelationWithOrg(org_id, user_id);
  }
}
