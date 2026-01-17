import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { User, UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import {
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
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

  const userCpf = faker.string.numeric(11);
  const userName = faker.person.fullName();
  const userEmail = faker.internet.email();
  const hashPassword =
    '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u';
  const fakeUserId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    const user = await prismaService.user.create({
      data: {
        cpf: userCpf,
        name: userName,
        email: userEmail,
        password: hashPassword,
        role: UserRole.OWNER,
      },
    });

    user_id = user.id;
  });

  afterAll(async () => {
    await prismaService.user.delete({
      where: {
        email: userEmail,
      },
    });
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
