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
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
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
import { UpdateOrganizationUseCase } from '../../usecases/UpdateOrganizationUseCase';

describe('Update a Org UseCase', () => {
  let updateOrgUseCase: UpdateOrganizationUseCase;
  let orgService: IOrganizationContract;
  let storageService: IStorageGw;
  let orgRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let org_id: string;

  const ownerId = faker.string.uuid();
  const orgName = faker.company.name();
  const orgEmail = faker.internet.email();
  const orgDescription = faker.lorem.paragraph();
  const cityName = faker.location.city();
  const locationCode =
    faker.location.countryCode('alpha-2') +
    '-' +
    faker.location.state({ abbreviated: true }) +
    '-' +
    faker.string.numeric(3);
  const openHour = faker.number.int({ min: 6, max: 10 });
  const closeHour = faker.number.int({ min: 18, max: 23 });
  const newOrgName = faker.company.name();
  const newOrgDescription = faker.lorem.paragraph();
  const newCityName = faker.location.city();
  const fileKey = `organization/${faker.string.uuid()}/${faker.system.fileName()}`;

  const owner_id = ownerId;

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
    const { id } = await prismaService.organization.create({
      data: {
        name: orgName,
        image_url: faker.image.url(),
        email: orgEmail,
        description: orgDescription,
        location_code: locationCode,
        open_hour: openHour,
        close_hour: closeHour,
        cep: faker.location.zipCode(),
        city: cityName,
        neighborhood: faker.location.street(),
        street: faker.location.streetAddress(),
        lat: faker.location.latitude(),
        long: faker.location.longitude(),
        owner_id,
      },
    });

    org_id = id;
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
    expect(org_id).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should update a organization', async () => {
    // Arrange
    const data = {
      id: org_id,
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
      where: { id: org_id },
    });
    const updated_org = await updateOrgUseCase.execute({
      id: data.id,
      owner_id: data.owner_id,
      data: data.data,
    });

    // Assert
    expect(old_org?.name).toBe(orgName);
    expect(old_org?.description).toBe(orgDescription);
    expect(updated_org).toBeInstanceOf(Organization);
    expect(updated_org.name).toBe(data.data.name);
    expect(updated_org.description).toBe(data.data.description);
    expect(updated_org.city).toBe(data.data.city);
    expect(updated_org.name).not.toBe(orgName);
    expect(updated_org.description).not.toBe(orgDescription);
    expect(updated_org.city).not.toBe(cityName);
  });

  it('Should throw an error if the user is not associated with the organization', async () => {
    // Arrange
    const data = {
      id: org_id,
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
      id: org_id,
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
