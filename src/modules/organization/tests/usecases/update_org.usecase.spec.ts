import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Organization } from 'src/core/domain/entities/organization';
import { PrismaService } from 'src/infra/database/database.service';
import { UserRepo } from 'src/modules/user/repo/user.repository';
import { IORGANIZATION_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';
import { OrganizationService } from '../../organization.service';
import { OrganizationRepo } from '../../repo/organization.repo';
import { UpdateOrganizationUseCase } from '../../usecases/UpdateOrganizationUseCase';

describe('Update a Org UseCase', () => {
  let updateOrgUseCase: UpdateOrganizationUseCase;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  const owner_id = 'testestes123131';
  let org_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOrganizationUseCase,
        UserRepo,
        OrganizationRepo,
        PrismaService,
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
        {
          provide: IUTILS_SERVICE,
          useValue: {
            verifyCepService: jest.fn(),
            validateHash: jest.fn(),
            generateHash: jest.fn(),
          },
        },
      ],
    }).compile();

    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    userRepo = module.get<UserRepo>(UserRepo);
    prismaService = module.get<PrismaService>(PrismaService);
    updateOrgUseCase = module.get<UpdateOrganizationUseCase>(
      UpdateOrganizationUseCase,
    );
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);

    const { id } = await prismaService.organization.create({
      data: {
        name: 'Restaurante Fogo de chão',
        image_url: 'https://example.com/images/clinica.jpg',
        email: 'contato@bemestar.com',
        description:
          'Clínica especializada em atendimento psicológico e terapias.',
        location_code: 'BR-MG-015',
        open_hour: 8,
        close_hour: 18,
        cep: '30130-010',
        city: 'Belo Horizonte',
        neighborhood: 'Funcionários',
        street: 'Rua da Bahia, 1200',
        lat: -19.92083,
        long: -43.937778,
        owner_id,
      },
    });

    org_id = id;
  });

  afterAll(async () => {
    await prismaService.organization.delete({
      where: {
        id: org_id,
      },
    });
  });

  it('Should be all services defined', () => {
    expect(updateOrgUseCase).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should update a organization', async () => {
    // Arrange
    const data = {
      id: org_id,
      owner_id,
      data: {
        name: 'Novo restaurante chegando',
        description: 'nova descrição papai',
        city: 'São Paulo',
      },
    };

    // Act
    const old_org = await prismaService.organization.findUnique({
      where: { id: org_id },
    });
    const updated_org = await updateOrgUseCase.execute(
      data.id,
      data.owner_id,
      data.data,
    );

    // Assert
    expect(old_org?.name).toBe('Restaurante Fogo de chão');
    expect(old_org?.description).toBe(
      'Clínica especializada em atendimento psicológico e terapias.',
    );
    expect(updated_org).toBeInstanceOf(Organization);
    expect(updated_org.name).toBe(data.data.name);
    expect(updated_org.description).toBe(data.data.description);
    expect(updated_org.city).toBe(data.data.city);
    expect(updated_org.name).not.toBe('Restaurante Fogo de chão');
    expect(updated_org.description).not.toBe(
      'Clínica especializada em atendimento psicológico e terapias.',
    );
    expect(updated_org.city).not.toBe('Belo Horizonte');
  });

  it('Should throw an error if the user is not associated with the organization', async () => {
    // Arrange
    const data = {
      id: org_id,
      owner_id,
      data: {
        name: 'Novo restaurante chegando',
        description: 'nova descrição papai',
        city: 'São Paulo',
      },
    };

    // Assert
    await expect(
      updateOrgUseCase.execute(data.id, 'data.owner_id', data.data),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the organization not exists', async () => {
    // Arrange
    const data = {
      id: org_id,
      owner_id,
      data: {
        name: 'Novo restaurante chegando',
        description: 'nova descrição papai',
        city: 'São Paulo',
      },
    };

    // Assert
    await expect(
      updateOrgUseCase.execute('data.id', data.owner_id, data.data),
    ).rejects.toThrow(NotFoundException);
  });
});
