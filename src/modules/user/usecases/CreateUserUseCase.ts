import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { createUserEntity, UserRole } from 'src/core/domain/entities/user';
import { IORGANIZATION_CONTRACT, IUSER_CONTRACT } from 'src/shared/constants';

interface ICreateUserUseCase {
  execute(
    data: IUserContract.CreateParams,
  ): Promise<IUserContract.CreateOutput>;
}

@Injectable()
export class CreateUserUseCase implements ICreateUserUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly organizationContract: IOrganizationContract,
  ) {}

  async execute({
    data,
    org_id,
  }: IUserContract.CreateParams): Promise<IUserContract.CreateOutput> {
    const orgExists = await this.organizationContract.get({ id: org_id });
    const newUser = createUserEntity({
      ...data,
      org_id,
    });
    const [userExistEmail, userExistCpf] = await Promise.all([
      this.userContract.getuserByEmail({ email: data.email }),
      this.userContract.getuserByCpf({ cpf: data.cpf }),
    ]);

    if (newUser.role === UserRole.OWNER) {
      throw new ConflictException('The user can not be a OWNER');
    }

    if (userExistEmail || userExistCpf) {
      throw new ConflictException('User already exists');
    }

    if (!newUser.org_id) {
      throw new BadRequestException(
        'Organization is required to create a new user',
      );
    }

    if (!orgExists) throw new NotFoundException('Organization not found');

    const user = await this.userContract.create({
      data: {
        cpf: data.cpf,
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
      },
      org_id: newUser.org_id,
    });

    return user;
  }
}
