import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { User, UserRole } from 'src/core/domain/entities/user';
import { HashService } from 'src/hash.service';
import { PrismaService } from 'src/infra/database/database.service';
import { COMPARE_HASH, IUSER_CONTRACT } from 'src/shared/constants';
import { UserRepo } from '../../repo/user.repository';
import { UpdateMeUseCase } from '../../usecases/UpdateMeUseCase';
import { UserService } from '../../user.service';

describe('Update the current user UseCase', () => {
  let updateMeUseCase: UpdateMeUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let hashService: HashService;
  let user_id: string;

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
          provide: HashService,
          useValue: {
            generateHash: jest.fn(),
            validateHash: jest.fn(),
          },
        },
        {
          provide: COMPARE_HASH,
          useFactory: (hash: HashService) => hash.validateHash,
          inject: [HashService],
        },
      ],
    }).compile();

    userService = module.get<UserService>(IUSER_CONTRACT);
    userRepo = module.get<UserRepo>(UserRepo);
    prismaService = module.get<PrismaService>(PrismaService);
    updateMeUseCase = module.get<UpdateMeUseCase>(UpdateMeUseCase);
    hashService = module.get<HashService>(HashService);

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
    await prismaService.user.delete({
      where: {
        id: user_id,
      },
    });
  });

  it('Should all services be defined', () => {
    expect(updateMeUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(hashService).toBeDefined();
    expect(user_id).toBeDefined();
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
    jest.spyOn(hashService, 'generateHash').mockResolvedValue('hash_pasword');
    jest.spyOn(hashService, 'validateHash').mockResolvedValue(true);

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
