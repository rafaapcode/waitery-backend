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
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { Organization } from 'src/core/domain/entities/organization';
import { PrismaService } from 'src/infra/database/database.service';
import { UserRepo } from 'src/modules/user/repo/user.repository';
import {
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { OrganizationService } from '../../organization.service';
import { OrganizationRepo } from '../../repo/organization.repo';
import { GetAllOrganizationUseCase } from '../../usecases/GetAllOrganizationUseCase';

describe('GetAll Orgs UseCase', () => {
  let getAllOrgUsecase: GetAllOrganizationUseCase;
  let orgService: IOrganizationContract;
  let storageService: IStorageGw;
  let orgRepo: OrganizationRepo;
  let userRepo: UserRepo;
  let prismaService: PrismaService;

  const ownerIdWithOrgs = faker.string.uuid();
  const ownerIdWithoutOrgs = faker.string.uuid();
  const orgBaseName = faker.company.name();
  const orgEmail = faker.internet.email();
  const locationCode =
    faker.location.countryCode('alpha-2') +
    '-' +
    faker.location.state({ abbreviated: true }) +
    '-' +
    faker.string.numeric(3);
  const openHour = faker.number.int({ min: 6, max: 10 });
  const closeHour = faker.number.int({ min: 18, max: 23 });

  const owner_id_with_orgs = ownerIdWithOrgs;
  const owner_id_without_orgs = ownerIdWithoutOrgs;

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
            verifyCepService: jest.fn(),
            validateHash: jest.fn(),
            generateHash: jest.fn(),
          },
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
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
    getAllOrgUsecase = module.get<GetAllOrganizationUseCase>(
      GetAllOrganizationUseCase,
    );
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);

    await prismaService.organization.createMany({
      data: Array.from({ length: 3 }).map((_, idx) => ({
        name: `${orgBaseName} ${idx}`,
        image_url: faker.image.url(),
        email: orgEmail,
        description: faker.lorem.paragraph(),
        location_code: locationCode,
        open_hour: openHour,
        close_hour: closeHour,
        cep: faker.location.zipCode(),
        city: faker.location.city(),
        neighborhood: faker.location.street(),
        street: faker.location.streetAddress(),
        lat: faker.location.latitude(),
        long: faker.location.longitude(),
        owner_id: owner_id_with_orgs,
      })),
    });
  });

  afterAll(async () => {
    await prismaService.organization.deleteMany({});
  });

  it('Should be all services defined', () => {
    expect(getAllOrgUsecase).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(storageService).toBeDefined();
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
