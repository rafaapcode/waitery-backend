import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
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
import { GetMeUseCase } from '../../usecases/GetMeUseCase';
import { UserService } from '../../user.service';

describe('Get Current User UseCase', () => {
  let getMeUseCase: GetMeUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let user_id: string;
  let storageService: IStorageGw;
  let factoriesService: FactoriesService;

  const fakeUserId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        UserRepo,
        PrismaService,
        GetMeUseCase,
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
    getMeUseCase = module.get<GetMeUseCase>(GetMeUseCase);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    const user = await factoriesService.generateUserInfo();

    user_id = user.id;
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(getMeUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(user_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should return the current user', async () => {
    // Act
    const currentUser = await getMeUseCase.execute(user_id);

    // Assert
    expect(currentUser).toBeInstanceOf(User);
  });

  it('Should throw an error if the user not exist', async () => {
    // Assert
    await expect(getMeUseCase.execute(fakeUserId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
