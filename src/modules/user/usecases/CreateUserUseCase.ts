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
import { ObservabilityService } from 'src/infra/observability/observability.service';
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
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute({
    data,
    org_ids,
  }: IUserContract.CreateParams): Promise<IUserContract.CreateOutput> {
    const className = CreateUserUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando criação de usuário '${data.email}' com CPF '${data.cpf}'.`,
    );
    try {
      if (!org_ids || org_ids.length === 0) {
        this.observabilityService.warn(
          className,
          `Nenhuma organização informada ao criar usuário '${data.email}'.`,
        );
        throw new BadRequestException(
          'At least one organization is required to create a new user',
        );
      }
      const orgExists = await this.organizationContract.getAllByOrgId({
        org_ids,
      });
      const newUser = createUserEntity({
        ...data,
        org_ids,
      });
      const [userExistEmail, userExistCpf] = await Promise.all([
        this.userContract.getuserByEmail({ email: data.email }),
        this.userContract.getuserByCpf({ cpf: data.cpf }),
      ]);
      if (newUser.role === UserRole.OWNER) {
        this.observabilityService.warn(
          className,
          `Tentativa de criar usuário OWNER para '${data.email}'.`,
        );
        throw new ConflictException('The user can not be a OWNER');
      }
      if (userExistEmail || userExistCpf) {
        this.observabilityService.warn(
          className,
          `Usuário já existe com email '${data.email}' ou CPF '${data.cpf}'.`,
        );
        throw new ConflictException('User already exists');
      }
      if (!newUser.org_ids || newUser.org_ids.length === 0) {
        this.observabilityService.warn(
          className,
          `Nenhuma organização válida ao criar usuário '${data.email}'.`,
        );
        throw new BadRequestException(
          'Organization is required to create a new user',
        );
      }
      if (!orgExists || orgExists.length === 0) {
        this.observabilityService.warn(
          className,
          `Organização não encontrada ao criar usuário '${data.email}'.`,
        );
        throw new NotFoundException('Organization not found');
      }
      const user = await this.userContract.create({
        data: {
          cpf: data.cpf,
          email: data.email,
          name: data.name,
          password: data.password,
          role: data.role,
        },
        org_ids: newUser.org_ids,
      });
      this.observabilityService.log(
        className,
        `Usuário '${data.email}' criado com sucesso.`,
      );
      return user;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao criar usuário '${data.email}'.`,
        '',
      );
      throw error;
    }
  }
}
