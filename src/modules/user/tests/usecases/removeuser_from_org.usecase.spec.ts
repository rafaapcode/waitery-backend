// Mock do módulo env ANTES de qualquer import que o utilize
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
    GOOGLE_MAPS_API_KEY: 'https://nominatim_teste.openstreetmap.org/search',
  },
}));

import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { PrismaService } from 'src/infra/database/database.service';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { UserRepo } from '../../repo/user.repository';
import { RemoveUserFromOrgUseCase } from '../../usecases/RemoveUserFromOrgUseCase';
import { UserService } from '../../user.service';

describe('Remove user from an organization UseCase', () => {
  let removeUserFromOrgUseCase: RemoveUserFromOrgUseCase;
  let observabilityService: ObservabilityService;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let organizationService: IOrganizationContract;
  let organizationRepo: OrganizationRepo;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let user_id: string;
  let storageService: IStorageGw;
  let factoriesService: FactoriesService;
  let org_ids: string[];

  const fakeUserId = faker.string.uuid();
  const fakeOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        UserRepo,
        PrismaService,
        RemoveUserFromOrgUseCase,
        OrganizationRepo,
        ObservabilityService,
        {
          provide: IUSER_CONTRACT,
          useClass: UserService,
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
        {
          provide: IUTILS_SERVICE,
          useValue: {
            generateHash: jest.fn(),
            validateHash: jest.fn(),
          },
        },
        {
          provide: ISTORAGE_SERVICE,
          useValue: {
            deleteFile: jest.fn(),
            getFileUrl: jest.fn(),
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<IUserContract>(IUSER_CONTRACT);
    userRepo = module.get<UserRepo>(UserRepo);
    prismaService = module.get<PrismaService>(PrismaService);
    removeUserFromOrgUseCase = module.get<RemoveUserFromOrgUseCase>(
      RemoveUserFromOrgUseCase,
    );
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);
    organizationService = module.get<IOrganizationContract>(
      IORGANIZATION_CONTRACT,
    );
    organizationRepo = module.get<OrganizationRepo>(OrganizationRepo);
    observabilityService =
      module.get<ObservabilityService>(ObservabilityService);

    const user = await factoriesService.generateUserInfo();
    const organization = await factoriesService.generateOrganizationWithOwner(
      user.id,
    );
    const organization2 = await factoriesService.generateOrganizationWithOwner(
      user.id,
    );
    const organization3 = await factoriesService.generateOrganizationWithOwner(
      user.id,
    );

    await prismaService.userOrg.createMany({
      data: [
        {
          org_id: organization.organization.id,
          user_id: user.id,
        },
        {
          org_id: organization2.organization.id,
          user_id: user.id,
        },
        {
          org_id: organization3.organization.id,
          user_id: user.id,
        },
      ],
    });

    user_id = user.id;
    org_ids = [
      organization.organization.id,
      organization2.organization.id,
      organization3.organization.id,
    ];
  });

  afterAll(async () => {
    await prismaService.userOrg.deleteMany({});
    await prismaService.user.deleteMany({});
    await prismaService.organization.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(removeUserFromOrgUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(user_id).toBeDefined();
    expect(storageService).toBeDefined();
    expect(org_ids).toBeDefined();
    expect(factoriesService).toBeDefined();
    expect(organizationService).toBeDefined();
    expect(organizationRepo).toBeDefined();
    expect(observabilityService).toBeDefined();
  });

  it('Should throw an error if the user does not exist', async () => {
    // Arrange
    const data: IUserContract.RemoveUserFromOrgParams = {
      org_ids,
      user_id: fakeUserId,
    };

    // Act
    await expect(removeUserFromOrgUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw an error if the org does not exist', async () => {
    // Arrange
    const data: IUserContract.RemoveUserFromOrgParams = {
      org_ids: [fakeOrgId],
      user_id,
    };

    // Act
    await expect(removeUserFromOrgUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should remove a user from an organization even if 1 of the orgs does not exist', async () => {
    // Arrange
    const data: IUserContract.RemoveUserFromOrgParams = {
      org_ids: [org_ids[0], fakeOrgId],
      user_id,
    };
    const userOrgBefore = await prismaService.userOrg.findMany({
      where: { user_id },
    });

    //Act
    await removeUserFromOrgUseCase.execute(data);

    const userOrgAfter = await prismaService.userOrg.findMany({
      where: { user_id },
    });
    // Assert
    expect(userOrgBefore).toHaveLength(3);
    expect(userOrgAfter).toHaveLength(2);
  });

  it('Should remove a user from an organizations', async () => {
    // Arrange
    const data: IUserContract.RemoveUserFromOrgParams = {
      org_ids: [org_ids[1], org_ids[2]],
      user_id,
    };
    const userOrgBefore = await prismaService.userOrg.findMany({
      where: { user_id },
    });

    //Act
    await removeUserFromOrgUseCase.execute(data);

    const userOrgAfter = await prismaService.userOrg.findMany({
      where: { user_id },
    });

    // Assert
    expect(userOrgBefore).toHaveLength(2);
    expect(userOrgAfter).toHaveLength(0);
  });
});
