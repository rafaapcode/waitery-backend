import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { PrismaService } from 'src/infra/database/database.service';
import { UserRepo } from 'src/modules/user/repo/user.repository';
import { IORGANIZATION_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';
import { OrganizationService } from '../../organization.service';
import { OrganizationRepo } from '../../repo/organization.repo';
import { DeleteOrganizationUseCase } from '../../usecases/DeleteOrganizationUseCase';

describe('Delete Org UseCase', () => {
  let deleteOrgUseCase: DeleteOrganizationUseCase;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let org_id: string;
  const owner_id = 'testestes123131';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteOrganizationUseCase,
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
    deleteOrgUseCase = module.get<DeleteOrganizationUseCase>(
      DeleteOrganizationUseCase,
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

  it('Should be all services defined', () => {
    expect(deleteOrgUseCase).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should delete a organization', async () => {
    // Act
    await deleteOrgUseCase.execute(org_id, owner_id);
    const org = await prismaService.organization.findUnique({
      where: { id: org_id },
    });

    // Assert
    expect(org).toBeNull();
  });

  it('Should throw an error if the owner is not related with the organization', async () => {
    // Act
    const org = await prismaService.organization.findUnique({
      where: { id: org_id },
    });

    // Assert
    await expect(deleteOrgUseCase.execute(org_id, owner_id)).rejects.toThrow(
      NotFoundException,
    );
    expect(org).toBeDefined();
  });

  it('Should throw an error if the org not exist', async () => {
    // Act
    org_id = '12313131';
    const org = await prismaService.organization.findUnique({
      where: { id: org_id },
    });

    // Assert
    await expect(deleteOrgUseCase.execute(org_id, owner_id)).rejects.toThrow(
      NotFoundException,
    );
    expect(org).toBeNull();
  });
});
