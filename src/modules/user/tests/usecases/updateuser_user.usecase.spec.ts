import { faker } from '@faker-js/faker';
import { ConflictException, NotFoundException } from '@nestjs/common';
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
import { UpdateUserUseCase } from '../../usecases/UpdateUserUseCase';
import { UserService } from '../../user.service';

describe('Update a user UseCase', () => {
  let updateUserUseCase: UpdateUserUseCase;
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
  const updatedName = faker.person.fullName();
  const updatedEmail = faker.internet.email();
  const fakeUserId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepo,
        PrismaService,
        UpdateUserUseCase,
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
    updateUserUseCase = module.get<UpdateUserUseCase>(UpdateUserUseCase);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);

    const user = await prismaService.user.create({
      data: {
        cpf: userCpf,
        name: userName,
        email: userEmail,
        password: hashPassword,
        role: UserRole.WAITER,
      },
    });

    user_id = user.id;
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(updateUserUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(user_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should update a user', async () => {
    // Arrange
    const data: IUserContract.UpdateParams = {
      id: user_id,
      data: {
        name: updatedName,
        email: updatedEmail,
      },
    };

    // Act
    const updated_user = await updateUserUseCase.execute(data);

    // Assert
    expect(updated_user).toBeInstanceOf(User);
    expect(updated_user.name).not.toBe(userName);
    expect(updated_user.email).not.toBe(userEmail);
  });

  it('Should  throw an error if the user not found', async () => {
    // Arrange
    const data: IUserContract.UpdateParams = {
      id: fakeUserId,
      data: {
        name: updatedName,
        email: updatedEmail,
      },
    };

    // Assert
    await expect(updateUserUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should  throw an error if the email is already beingg used', async () => {
    // Arrange
    const data: IUserContract.UpdateParams = {
      id: user_id,
      data: {
        name: updatedName,
        email: updatedEmail,
      },
    };

    // Assert
    await expect(updateUserUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });
});
