jest.mock('src/shared/config/env', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret-key',
    REFRESH_JWT_SECRET: 'test-refresh-jwt-secret',
    PORT: '3000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    CEP_SERVICE_API_URL: 'https://test-cep-api.com',
    CDN_URL: 'https://test-cdn.com',
    BUCKET_NAME: 'test-bucket',
    NODE_ENV: 'test',
  },
}));

import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Organization as OrgPrisma } from 'generated/prisma';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Organization } from 'src/core/domain/entities/organization';
import { PrismaService } from 'src/infra/database/database.service';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { UserRepo } from 'src/modules/user/repo/user.repository';
import {
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { OrganizationService } from '../../organization.service';
import { OrganizationRepo } from '../../repo/organization.repo';
import { UpdateOrganizationUseCase } from '../../usecases/UpdateOrganizationUseCase';

describe('Update a Org UseCase', () => {
  let updateOrgUseCase: UpdateOrganizationUseCase;
  let orgService: IOrganizationContract;
  let storageService: IStorageGw;
  let observabilityService: ObservabilityService;
  let orgRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let organization: OrgPrisma;
  let factoriesService: FactoriesService;
  let owner_id: string;

  const newOrgName = faker.company.name();
  const newOrgDescription = faker.lorem.paragraph();
  const newCityName = faker.location.city();
  const fileKey = `organization/${faker.string.uuid()}/${faker.system.fileName()}`;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        UpdateOrganizationUseCase,
        UserRepo,
        OrganizationRepo,
        PrismaService,
        ObservabilityService,
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
        {
          provide: ISTORAGE_SERVICE,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getFileKey: jest.fn(),
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
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);
    observabilityService =
      module.get<ObservabilityService>(ObservabilityService);

    const { organization: org, owner } =
      await factoriesService.generateOrganizationWithOwner();

    organization = org;
    owner_id = owner.id;
  });

  afterAll(async () => {
    await prismaService.organization.deleteMany({});
  });

  it('Should be all services defined', () => {
    expect(updateOrgUseCase).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(organization).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
    expect(factoriesService).toBeDefined();
    expect(owner_id).toBeDefined();
    expect(observabilityService).toBeDefined();
  });

  it('Should update a organization', async () => {
    // Arrange
    const data = {
      id: organization.id,
      owner_id,
      data: {
        name: newOrgName,
        description: newOrgDescription,
        city: newCityName,
      },
    };
    jest
      .spyOn(storageService, 'uploadFile')
      .mockResolvedValue({ fileKey: fileKey });
    jest
      .spyOn(storageService, 'deleteFile')
      .mockResolvedValue({ success: true });

    // Act
    const old_org = await prismaService.organization.findUnique({
      where: { id: organization.id },
    });
    const updated_org = await updateOrgUseCase.execute({
      id: data.id,
      owner_id: data.owner_id,
      data: data.data,
    });

    // Assert
    expect(old_org?.name).toBe(organization.name);
    expect(old_org?.description).toBe(organization.description);
    expect(updated_org).toBeInstanceOf(Organization);
    expect(updated_org.name).toBe(data.data.name);
    expect(updated_org.description).toBe(data.data.description);
    expect(updated_org.city).toBe(data.data.city);
    expect(updated_org.name).not.toBe(organization.name);
    expect(updated_org.description).not.toBe(organization.description);
    expect(updated_org.city).not.toBe(organization.city);
  });

  it('Should throw an error if the user is not associated with the organization', async () => {
    // Arrange
    const data = {
      id: organization.id,
      owner_id,
      data: {
        name: newOrgName,
        description: newOrgDescription,
        city: newCityName,
      },
    };

    // Assert
    await expect(
      updateOrgUseCase.execute({
        id: data.id,
        owner_id: faker.string.uuid(),
        data: data.data,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the organization not exists', async () => {
    // Arrange
    const data = {
      id: organization.id,
      owner_id,
      data: {
        name: newOrgName,
        description: newOrgDescription,
        city: newCityName,
      },
    };

    // Assert
    await expect(
      updateOrgUseCase.execute({
        id: faker.string.uuid(),
        owner_id: data.owner_id,
        data: data.data,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
