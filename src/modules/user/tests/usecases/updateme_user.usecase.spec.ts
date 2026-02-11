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
import { UpdateMeUseCase } from '../../usecases/UpdateMeUseCase';
import { UserService } from '../../user.service';

describe('Update the current user UseCase', () => {
  let updateMeUseCase: UpdateMeUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let user_id: string;
  let storageService: IStorageGw;
  let factoriesService: FactoriesService;

  const userName = faker.person.fullName();
  const userEmail = faker.internet.email();
  const currentPassword = faker.internet.password();
  const updatedName = faker.person.fullName();
  const updatedEmail = faker.internet.email();
  const secondUpdatedEmail = faker.internet.email();
  const thirdUpdatedEmail = faker.internet.email();
  const newPassword = faker.internet.password();
  const wrongPassword = faker.internet.password();
  const hashNewPassword = faker.internet.password({ length: 20 });
  const fakeUserId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        UserRepo,
        PrismaService,
        UpdateMeUseCase,
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
    updateMeUseCase = module.get<UpdateMeUseCase>(UpdateMeUseCase);
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
    expect(updateMeUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(user_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should update the current user without a new_password', async () => {
    // Arrange
    const data: IUserContract.UpdateMeParams = {
      id: user_id,
      data: {
        name: updatedName,
        email: updatedEmail,
      },
    };

    // Act
    const updated_user = await updateMeUseCase.execute(data);

    // Assert
    expect(updated_user).toBeInstanceOf(User);
    expect(updated_user.name).not.toBe(userName);
    expect(updated_user.email).not.toBe(userEmail);
  });

  it('Should throw an error if the user is not found', async () => {
    // Arrange
    const data: IUserContract.UpdateMeParams = {
      id: fakeUserId,
      data: {
        name: updatedName,
        email: updatedEmail,
      },
    };

    // Assert
    await expect(updateMeUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw an error if the email is already being used', async () => {
    // Arrange
    const data: IUserContract.UpdateMeParams = {
      id: user_id,
      data: {
        name: updatedName,
        email: updatedEmail,
      },
    };

    // Assert
    await expect(updateMeUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should throw an error if the current password is not provided', async () => {
    // Arrange
    const data: IUserContract.UpdateMeParams = {
      id: user_id,
      data: {
        name: updatedName,
        email: secondUpdatedEmail,
        new_password: newPassword,
      },
    };

    // Assert
    await expect(updateMeUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw an error if the current password is incorrect', async () => {
    // Arrange
    const data: IUserContract.UpdateMeParams = {
      id: user_id,
      data: {
        name: updatedName,
        email: secondUpdatedEmail,
        new_password: newPassword,
        password: wrongPassword,
      },
    };

    // Assert
    await expect(updateMeUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should update the password of current user', async () => {
    // Arrange
    const data: IUserContract.UpdateMeParams = {
      id: user_id,
      data: {
        name: updatedName,
        email: thirdUpdatedEmail,
        new_password: newPassword,
        password: currentPassword,
      },
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue(hashNewPassword);
    jest.spyOn(utilsService, 'validateHash').mockResolvedValue(true);

    // Act
    const updatedUser = await updateMeUseCase.execute(data);

    const user = await prismaService.user.findUnique({
      where: {
        id: user_id,
      },
    });

    // Assert
    expect(updatedUser).toBeInstanceOf(User);
    expect(updatedUser.email).toBe(thirdUpdatedEmail);
    expect(user?.password).toBe(hashNewPassword);
  });
});
