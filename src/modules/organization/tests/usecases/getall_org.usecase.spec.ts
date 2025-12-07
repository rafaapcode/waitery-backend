import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Organization } from 'src/core/domain/entities/organization';
import { PrismaService } from 'src/infra/database/database.service';
import { UserRepo } from 'src/modules/user/repo/user.repository';
import { IORGANIZATION_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';
import { OrganizationService } from '../../organization.service';
import { OrganizationRepo } from '../../repo/organization.repo';
import { GetAllOrganizationUseCase } from '../../usecases/GetAllOrganizationUseCase';

describe('GetAll Orgs UseCase', () => {
  let getAllOrgUsecase: GetAllOrganizationUseCase;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  const owner_id_with_orgs = 'testestes123131';
  const owner_id_without_orgs = 'testestes12313113131';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllOrganizationUseCase,
        UserRepo,
        OrganizationRepo,
        PrismaService,
        {
          provide: IUTILS_SERVICE,
          useValue: {
            generateHash: jest.fn(),
          },
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
      ],
    }).compile();

    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    userRepo = module.get<UserRepo>(UserRepo);
    prismaService = module.get<PrismaService>(PrismaService);
    getAllOrgUsecase = module.get<GetAllOrganizationUseCase>(
      GetAllOrganizationUseCase,
    );

    await prismaService.organization.createMany({
      data: Array.from({ length: 3 }).map((_, idx) => ({
        name: `Restaurante Fogo de chão ${idx}`,
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
        owner_id: owner_id_with_orgs,
      })),
    });
  });

  afterAll(async () => {
    await prismaService.organization.deleteMany({
      where: {
        owner_id: owner_id_with_orgs,
      },
    });
  });

  it('Should be all services defined', () => {
    expect(getAllOrgUsecase).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  it('Should get all organizations', async () => {
    // Act
    const orgs = await getAllOrgUsecase.execute(owner_id_with_orgs);

    // Assert
    expect(orgs.length).toBe(3);
    expect(orgs[0]).toBeInstanceOf(Organization);
  });

  it('Should throw na error if no Org is returned', async () => {
    await expect(
      getAllOrgUsecase.execute(owner_id_without_orgs),
    ).rejects.toThrow(NotFoundException);
  });
});
