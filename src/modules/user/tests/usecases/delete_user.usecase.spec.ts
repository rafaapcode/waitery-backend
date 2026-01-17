import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import {
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { UserRepo } from '../../repo/user.repository';
import { DeleteUserUseCase } from '../../usecases/DeleteUserUseCase';
import { UserService } from '../../user.service';

describe('Delete User UseCase', () => {
  let deleteUserUseCase: DeleteUserUseCase;
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

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    const { id } = await prismaService.user.create({
      data: {
        cpf: userCpf,
        name: userName,
        email: userEmail,
        password: hashPassword,
        role: UserRole.OWNER,
      },
    });
    user_id = id;
  });

  it('Should all services be defined', () => {
    expect(deleteUserUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(user_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should delete a user', async () => {
    // Act
    await deleteUserUseCase.execute(user_id);
    const user = await prismaService.user.findUnique({
      where: { id: user_id },
    });

    // Assert
    expect(user).toBeNull();
  });

  it('Should throw an error if the user not found', async () => {
    // Assert
    await expect(deleteUserUseCase.execute(user_id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
