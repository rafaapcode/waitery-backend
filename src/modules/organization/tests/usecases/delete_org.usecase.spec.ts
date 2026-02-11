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
    OPEN_STREET_MAP_URL: 'https://nominatim_teste.openstreetmap.org/search',
  },
}));

import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
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
import { DeleteOrganizationUseCase } from '../../usecases/DeleteOrganizationUseCase';

describe('Delete Org UseCase', () => {
  let deleteOrgUseCase: DeleteOrganizationUseCase;
  let observabilityService: ObservabilityService;
  let orgService: IOrganizationContract;
  let storageService: IStorageGw;
  let orgRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let org_id: string;
  let factoriesService: FactoriesService;
  let owner_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        DeleteOrganizationUseCase,
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
    deleteOrgUseCase = module.get<DeleteOrganizationUseCase>(
      DeleteOrganizationUseCase,
    );
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);
    observabilityService =
      module.get<ObservabilityService>(ObservabilityService);

    const { organization } =
      await factoriesService.generateOrganizationWithOwner();
    org_id = organization.id;
    owner_id = organization.owner_id;
  });

  it('Should be all services defined', () => {
    expect(deleteOrgUseCase).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(owner_id).toBeDefined();
    expect(factoriesService).toBeDefined();
    expect(observabilityService).toBeDefined();
  });

  it('Should delete a organization', async () => {
    // Arrange
    jest
      .spyOn(storageService, 'deleteFile')
      .mockResolvedValue({ success: true });

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
    org_id = faker.string.uuid();
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
