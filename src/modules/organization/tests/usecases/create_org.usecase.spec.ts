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
    OPEN_STREET_MAP_URL: 'https://nominatim_teste.openstreetmap.org/search',
  },
}));

import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import {
  createOganizationEntity,
  Organization,
} from 'src/core/domain/entities/organization';
import { PrismaService } from 'src/infra/database/database.service';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { UserRepo } from 'src/modules/user/repo/user.repository';
import { UserService } from 'src/modules/user/user.service';
import {
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { OrganizationService } from '../../organization.service';
import { OrganizationRepo } from '../../repo/organization.repo';
import {
  CreateOrganizationParams,
  CreateOrganizationUseCase,
} from '../../usecases/CreateOrganizationUseCase';

describe('Create Org UseCase', () => {
  let createOrgUseCase: CreateOrganizationUseCase;
  let observabilityService: ObservabilityService;
  let orgService: IOrganizationContract;
  let storageService: IStorageGw;
  let userService: IUserContract;
  let orgRepo: OrganizationRepo;
  let userRepo: UserRepo;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;
  let owner_id: string;
  let factoriesService: FactoriesService;

  const org1Name = faker.company.name();
  const org1Email = faker.internet.email();
  const org2Email = faker.internet.email();
  const locationCode =
    faker.location.countryCode('alpha-2') +
    '-' +
    faker.location.state({ abbreviated: true }) +
    '-' +
    faker.string.numeric(3);
  const openHour = faker.number.int({ min: 6, max: 10 });
  const closeHour = faker.number.int({ min: 18, max: 23 });
  const cityName = faker.location.city();
  const stateAbbr = faker.location.state({ abbreviated: true });
  const regionName = faker.helpers.arrayElement([
    'Norte',
    'Nordeste',
    'Centro-Oeste',
    'Sudeste',
    'Sul',
  ]);
  const imageUrl = `https://waitery.s3.teste/organization/${faker.string.uuid()}/logo.png`;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        CreateOrganizationUseCase,
        UserRepo,
        OrganizationRepo,
        PrismaService,
        ObservabilityService,
        {
          provide: IUTILS_SERVICE,
          useValue: {
            verifyCepService: jest.fn(),
            validateHash: jest.fn(),
            generateHash: jest.fn(),
            getCepAddressInformations: jest.fn(),
            getLatAndLongFromAddress: jest.fn(),
          },
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
        {
          provide: IUSER_CONTRACT,
          useClass: UserService,
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
    userService = module.get<IUserContract>(IUSER_CONTRACT);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    userRepo = module.get<UserRepo>(UserRepo);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    prismaService = module.get<PrismaService>(PrismaService);
    createOrgUseCase = module.get<CreateOrganizationUseCase>(
      CreateOrganizationUseCase,
    );
    factoriesService = module.get<FactoriesService>(FactoriesService);
    observabilityService =
      module.get<ObservabilityService>(ObservabilityService);

    const { id } = await factoriesService.generateUserInfo();
    owner_id = id;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(async () => {
    await prismaService.user.deleteMany({});
    await prismaService.organization.deleteMany({});
  });

  it('Should be all services defined', () => {
    expect(orgService).toBeDefined();
    expect(userService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(storageService).toBeDefined();
    expect(owner_id).toBeDefined();
    expect(createOrgUseCase).toBeDefined();
    expect(observabilityService).toBeDefined();
  });

  it('Should create a new Organization', async () => {
    // Arrange
    const data: CreateOrganizationParams = {
      owner_id,
      data: {
        name: org1Name,
        email: org1Email,
        description: faker.lorem.paragraph(),
        location_code: locationCode,
        open_hour: openHour,
        close_hour: closeHour,
        cep: faker.location.zipCode(),
      },
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_password');
    jest.spyOn(utilsService, 'getCepAddressInformations').mockResolvedValue({
      cep: faker.location.zipCode(),
      logradouro: faker.location.street(),
      complemento: faker.location.secondaryAddress(),
      unidade: '',
      bairro: faker.location.street(),
      localidade: cityName,
      uf: stateAbbr,
      estado: faker.location.state(),
      regiao: regionName,
      ibge: faker.string.numeric(7),
      gia: faker.string.numeric(4),
      ddd: faker.string.numeric(2),
      siafi: faker.string.numeric(4),
    });
    jest.spyOn(utilsService, 'getLatAndLongFromAddress').mockResolvedValue({
      lat: faker.location.latitude(),
      lon: faker.location.longitude(),
    });
    const infos = await orgService.getAddressInformation(data.data.cep);
    const infosLatLon = await orgService.getLatLongFromAddress(infos!);
    jest.clearAllMocks();
    jest.spyOn(orgService, 'uploadFile').mockResolvedValue(
      createOganizationEntity({
        ...data.data,
        close_hour: Number(data.data.close_hour),
        open_hour: Number(data.data.open_hour),
        owner_id,
        city: infos ? `${infos.localidade}-${infos.uf}` : '',
        neighborhood: infos ? infos.bairro : '',
        street: infos ? infos.logradouro : '',
        lat: infosLatLon?.lat || 0,
        long: infosLatLon?.lon || 0,
      }),
    );

    // Act
    const newOrg = await createOrgUseCase.execute(data);

    //Assert
    expect(utilsService.getCepAddressInformations).toHaveBeenCalledTimes(1);
    expect(utilsService.getCepAddressInformations).toHaveBeenCalledWith(
      data.data.cep,
    );
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    expect(orgService.uploadFile).toHaveBeenCalledTimes(0);
    expect(newOrg).toBeInstanceOf(Organization);
    expect(newOrg.lat).toBe(infosLatLon?.lat);
    expect(newOrg.long).toBe(infosLatLon?.lon);
    expect(newOrg.owner_id).toBe(owner_id);
    expect(orgService.uploadFile).toHaveBeenCalledTimes(0);
  });

  it('Should thrown an error if the owner not exists', async () => {
    // Arrange
    const data: CreateOrganizationParams = {
      owner_id: faker.string.uuid(),
      data: {
        name: faker.company.name(),
        email: faker.internet.email(),
        description: faker.lorem.paragraph(),
        location_code: locationCode,
        open_hour: openHour,
        close_hour: closeHour,
        cep: faker.location.zipCode(),
      },
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_password');

    //Assert
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createOrgUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should thrown an error if the org already exists', async () => {
    // Arrange
    const data: CreateOrganizationParams = {
      owner_id,
      data: {
        name: org1Name,
        email: org1Email,
        description: faker.lorem.paragraph(),
        location_code: locationCode,
        open_hour: openHour,
        close_hour: closeHour,
        cep: faker.location.zipCode(),
      },
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_password');

    //Assert
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createOrgUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should upload a file and create the imageUrl if the image_file is provided', async () => {
    // Arrange
    const image_file = {
      originalname: faker.system.fileName(),
      buffer: Buffer.from('file_buffer'),
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;
    const data: CreateOrganizationParams = {
      owner_id,
      data: {
        name: faker.company.name(),
        email: org2Email,
        description: faker.lorem.paragraph(),
        location_code: locationCode,
        open_hour: openHour,
        close_hour: closeHour,
        cep: faker.location.zipCode(),
      },
      image_file,
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_password');
    const infos = await orgService.getAddressInformation(data.data.cep);
    const org_data = createOganizationEntity({
      ...data.data,
      close_hour: Number(data.data.close_hour),
      open_hour: Number(data.data.open_hour),
      owner_id,
      city: infos ? `${infos.localidade}-${infos.uf}` : '',
      neighborhood: infos ? infos.bairro : '',
      street: infos ? infos.logradouro : '',
      lat: faker.location.latitude(),
      long: faker.location.longitude(),
      image_url: imageUrl,
    });
    jest.spyOn(orgService, 'uploadFile').mockResolvedValue(org_data);

    // Act
    const newOrg = await createOrgUseCase.execute(data);

    //Assert
    expect(newOrg).toBeInstanceOf(Organization);
    expect(newOrg.image_url).toBeTruthy();
    expect(newOrg.owner_id).toBe(owner_id);
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    expect(orgService.uploadFile).toHaveBeenCalledTimes(1);
  });

  it('Should throw an error if the CEP is invalid', async () => {
    // Arrange
    const data: CreateOrganizationParams = {
      owner_id,
      data: {
        name: org1Name,
        email: org1Email,
        description: faker.lorem.paragraph(),
        location_code: locationCode,
        open_hour: openHour,
        close_hour: closeHour,
        cep: faker.location.zipCode(),
      },
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_password');
    jest
      .spyOn(utilsService, 'getCepAddressInformations')
      .mockResolvedValue(null);
    jest
      .spyOn(utilsService, 'getLatAndLongFromAddress')
      .mockResolvedValue(undefined);
    const infos = await orgService.getAddressInformation(data.data.cep);
    const infosLatLon = await orgService.getLatLongFromAddress(infos!);
    jest.clearAllMocks();
    jest.spyOn(orgService, 'uploadFile').mockResolvedValue(
      createOganizationEntity({
        ...data.data,
        close_hour: Number(data.data.close_hour),
        open_hour: Number(data.data.open_hour),
        owner_id,
        city: infos ? `${infos.localidade}-${infos.uf}` : '',
        neighborhood: infos ? infos.bairro : '',
        street: infos ? infos.logradouro : '',
        lat: infosLatLon?.lat || 0,
        long: infosLatLon?.lon || 0,
      }),
    );

    //Assert
    await expect(createOrgUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });
});
