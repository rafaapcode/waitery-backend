import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User as UserPrisma } from 'generated/prisma';
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
import { GetUserUseCase } from '../../usecases/GetUserUseCase';
import { UserService } from '../../user.service';

describe('Get User UseCase', () => {
  let getUserUseCase: GetUserUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let user: UserPrisma;
  let storageService: IStorageGw;
  let factoriesService: FactoriesService;

  const fakeUserId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        UserRepo,
        PrismaService,
        GetUserUseCase,
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
    getUserUseCase = module.get<GetUserUseCase>(GetUserUseCase);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    user = await factoriesService.generateUserInfo();
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(getUserUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(user).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should return a user', async () => {
    // Act
    const currentUser = await getUserUseCase.execute(user.id);

    // Assert
    expect(currentUser).toBeInstanceOf(User);
  });

  it('Should throw an error if the user not exist', async () => {
    // Assert
    await expect(getUserUseCase.execute(fakeUserId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
