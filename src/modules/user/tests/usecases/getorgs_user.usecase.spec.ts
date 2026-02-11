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
import { Test, TestingModule } from '@nestjs/testing';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Organization } from 'src/core/domain/entities/organization';
import { PrismaService } from 'src/infra/database/database.service';
import {
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { UserRepo } from '../../repo/user.repository';
import { GetOrgsOfUserUseCase } from '../../usecases/GetOrgsOfUserUseCase';
import { UserService } from '../../user.service';

describe('Get Orgs Of Users UseCase', () => {
  let getOrgsOfUserUsecase: GetOrgsOfUserUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let user_id: string;
  let storageService: IStorageGw;
  let factoriesService: FactoriesService;
  let orgNames: string[];

  const fakeUserId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        UserRepo,
        PrismaService,
        GetOrgsOfUserUseCase,
        {
          provide: IUSER_CONTRACT,
          useClass: UserService,
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
    getOrgsOfUserUsecase =
      module.get<GetOrgsOfUserUseCase>(GetOrgsOfUserUseCase);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    const user = await factoriesService.generateUserInfo();

    const { organizations } =
      await factoriesService.generateManyOrganizationWithOwner(4, user.id);

    user_id = user.id;
    orgNames = organizations.map((org) => org.name);
  });

  afterAll(async () => {
    await prismaService.organization.deleteMany({});

    await prismaService.user.deleteMany({});
  }, 15000);

  it('Should all services be defined', () => {
    expect(getOrgsOfUserUsecase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(user_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should get all orgs fo a user', async () => {
    // Act
    const orgs = await getOrgsOfUserUsecase.execute(user_id);

    // Assert
    expect(orgs.length).toBe(4);
    expect(orgs[0]).toBeInstanceOf(Organization);
    const orgNamesReceived = orgs.map((org) => org.name);
    expect(orgNamesReceived).toEqual(expect.arrayContaining(orgNames));
    expect(orgNames).toEqual(expect.arrayContaining(orgNamesReceived));
  });

  it('Should return an empty array', async () => {
    // Act
    const orgs = await getOrgsOfUserUsecase.execute(fakeUserId);

    // Assert
    expect(orgs.length).toBe(0);
    expect(orgs).toMatchObject([]);
  });
});
