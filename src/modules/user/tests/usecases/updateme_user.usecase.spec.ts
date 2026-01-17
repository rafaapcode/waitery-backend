import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    const user = await prismaService.user.create({
      data: {
        cpf: '45587667820',
        name: 'rafael ap',
        email: 'rafa.ap.ap.ap2003@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: UserRole.OWNER,
      },
    });

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
        name: 'Rafael Aparecido legal',
        email: 'rafael@gmail.com',
      },
    };

    // Act
    const updated_user = await updateMeUseCase.execute(data);

    // Assert
    expect(updated_user).toBeInstanceOf(User);
    expect(updated_user.name).not.toBe('rafael ap');
    expect(updated_user.email).not.toBe('rafa.ap.ap.ap2003@gmail.com');
  });

  it('Should throw an error if the user is not found', async () => {
    // Arrange
    const data: IUserContract.UpdateMeParams = {
      id: 'user_id',
      data: {
        name: 'Rafael Aparecido legal',
        email: 'rafael@gmail.com',
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
        name: 'Rafael Aparecido legal',
        email: 'rafael@gmail.com',
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
        name: 'Rafael Aparecido',
        email: 'rafaelchicos@gmail.com',
        new_password: 'testando_123123',
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
        name: 'Rafael Aparecido',
        email: 'rafaelchicos@gmail.com',
        new_password: 'testando_123123',
        password: 'rafinha123123',
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
        name: 'Rafael Aparecido',
        email: 'rafaelchicos@gmail.com',
        new_password: 'testando_123123',
        password: 'qweasdzxc2003',
      },
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_pasword');
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
    expect(updatedUser.email).toBe('rafaelchicos@gmail.com');
    expect(user?.password).toBe('hash_pasword');
  });
});
