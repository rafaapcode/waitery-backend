import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'generated/prisma';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { PrismaService } from 'src/infra/database/database.service';
import {
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { UserRepo } from '../../repo/user.repository';
import { DeleteUserUseCase } from '../../usecases/DeleteUserUseCase';
import { UserService } from '../../user.service';

describe('Delete User UseCase', () => {
  let deleteUserUseCase: DeleteUserUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let user: User;
  let storageService: IStorageGw;
  let factoriesService: FactoriesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        UserRepo,
        PrismaService,
        DeleteUserUseCase,
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
    deleteUserUseCase = module.get<DeleteUserUseCase>(DeleteUserUseCase);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    const usercreated = await factoriesService.generateUserInfo();
    user = usercreated;
  });

  it('Should all services be defined', () => {
    expect(deleteUserUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(user).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should delete a user', async () => {
    // Act
    await deleteUserUseCase.execute(user.id);
    const deletedUser = await prismaService.user.findUnique({
      where: { id: user.id },
    });

    // Assert
    expect(deletedUser).toBeNull();
  });

  it('Should throw an error if the user not found', async () => {
    // Assert
    await expect(deleteUserUseCase.execute(user.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
