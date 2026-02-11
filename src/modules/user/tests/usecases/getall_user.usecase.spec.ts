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
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { User } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import {
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { UserRepo } from '../../repo/user.repository';
import { GetAllUserUseCase } from '../../usecases/GetAllUserUseCase';
import { UserService } from '../../user.service';

describe('GetAll Users UseCase', () => {
  let getAllUserUseCase: GetAllUserUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let user_id: string;
  let org_id: string;
  let storageService: IStorageGw;
  let factoriesService: FactoriesService;

  const fakeUserId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        UserRepo,
        PrismaService,
        GetAllUserUseCase,
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
    getAllUserUseCase = module.get<GetAllUserUseCase>(GetAllUserUseCase);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    const user = await factoriesService.generateUserInfo();

    await factoriesService.generateManyUserInfo(25);

    const org = await factoriesService.generateOrganizationWithOwner(user.id);

    await prismaService.userOrg.create({
      data: {
        org_id: org.organization.id,
        user_id: user.id,
      },
    });

    org_id = org.organization.id;
    user_id = user.id;
  });

  afterAll(async () => {
    await prismaService.userOrg.deleteMany({});
    await prismaService.user.deleteMany({});
    await prismaService.user.deleteMany({});
  }, 15000);

  it('Should all services be defined', () => {
    expect(getAllUserUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(user_id).toBeDefined();
    expect(org_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should return the first 10 users in the page 0', async () => {
    // Act
    const { has_next, users } = await getAllUserUseCase.execute({
      org_id,
      page: 0,
      owner_id: user_id,
    });

    //Assert
    expect(has_next).toBeTruthy();
    expect(users.length).toBe(10);
    expect(users[0]).toBeInstanceOf(User);
  });

  it('Should return the 10 users differents in the page 1', async () => {
    // Act
    const usersFirstPage = await getAllUserUseCase.execute({
      org_id,
      page: 0,
      owner_id: user_id,
    });
    const { has_next, users } = await getAllUserUseCase.execute({
      org_id,
      page: 1,
      owner_id: user_id,
    });

    //Assert
    expect(has_next).toBeTruthy();
    expect(users.length).toBe(10);
    expect(users[0]).toBeInstanceOf(User);
    expect(users[0].id).not.toEqual(usersFirstPage.users[0].id);
    expect(users[0].name).not.toEqual(usersFirstPage.users[0].name);
  });

  it('Should return the last 5 users differents in the page 2', async () => {
    // Act
    const usersSecondPage = await getAllUserUseCase.execute({
      org_id,
      page: 1,
      owner_id: user_id,
    });
    const { has_next, users } = await getAllUserUseCase.execute({
      org_id,
      page: 2,
      owner_id: user_id,
    });

    //Assert
    expect(has_next).toBeFalsy();
    expect(users.length).toBeGreaterThan(5);
    expect(users.length).toBeLessThan(10);
    expect(users[0]).toBeInstanceOf(User);
    expect(users[0].id).not.toEqual(usersSecondPage.users[0].id);
    expect(users[0].name).not.toEqual(usersSecondPage.users[0].name);
  });

  it('Should return 0 users in the page 3', async () => {
    // Act
    const { has_next, users } = await getAllUserUseCase.execute({
      org_id,
      page: 3,
      owner_id: user_id,
    });

    //Assert
    expect(has_next).toBeFalsy();
    expect(users.length).toBe(0);
    expect(users).toMatchObject([]);
  });

  it('Should throw an error if the user has not association with the organization', async () => {
    // Assert
    await expect(
      getAllUserUseCase.execute({
        org_id,
        page: 3,
        owner_id: fakeUserId,
      }),
    ).rejects.toThrow(ConflictException);
  });
});
