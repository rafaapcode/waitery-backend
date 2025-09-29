import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { createOganizationEntity } from 'src/core/domain/entities/organization';
import { IORGANIZATION_CONTRACT, IUSER_CONTRACT } from 'src/shared/constants';

interface ICreateOrganizationUseCase {
  execute(
    params: IOrganizationContract.CreateParams,
  ): Promise<IOrganizationContract.CreateOutput>;
}

@Injectable()
export class CreateOrganizationUseCase implements ICreateOrganizationUseCase {
  constructor(
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
    @Inject(IUSER_CONTRACT)
    private readonly userService: IUserContract,
  ) {}

  async execute({
    data,
    owner_id,
  }: IOrganizationContract.CreateParams): Promise<IOrganizationContract.CreateOutput> {
    const organization = createOganizationEntity({
      ...data,
      owner_id,
    });

    const [org, owner] = await Promise.all([
      this.orgService.verifyOrgByName({
        name: organization.name,
        owner_id: organization.owner_id,
      }),
      this.userService.get({ id: organization.owner_id }),
    ]);

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    if (org) {
      throw new ConflictException(
        `Organization with the name '${organization.name}' already exist`,
      );
    }

    return await this.orgService.create({
      data: organization,
      owner_id: organization.owner_id,
    });
  }
}
