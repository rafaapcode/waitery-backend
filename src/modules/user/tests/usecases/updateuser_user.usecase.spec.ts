import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { User, UserRole } from 'src/core/domain/entities/user';
import { HashService } from 'src/hash.service';
import { PrismaService } from 'src/infra/database/database.service';
import { IUSER_CONTRACT } from 'src/shared/constants';
import { UserRepo } from '../../repo/user.repository';
import { UpdateUserUseCase } from '../../usecases/UpdateUserUseCase';
import { UserService } from '../../user.service';

describe('Update a user UseCase', () => {
  let updateUserUseCase: UpdateUserUseCase;
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
        UpdateUserUseCase,
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
      ],
    }).compile();

    userService = module.get<IUserContract>(IUSER_CONTRACT);
    userRepo = module.get<UserRepo>(UserRepo);
    prismaService = module.get<PrismaService>(PrismaService);
    updateUserUseCase = module.get<UpdateUserUseCase>(UpdateUserUseCase);
    hashService = module.get<HashService>(HashService);

    const user = await prismaService.user.create({
      data: {
        cpf: '45587667820',
        name: 'rafael ap',
        email: 'rafa.ap.ap.ap2003@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: UserRole.WAITER,
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
    expect(updateUserUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(hashService).toBeDefined();
    expect(user_id).toBeDefined();
  });

  it('Should update a user', async () => {
    // Arrange
    const data: IUserContract.UpdateParams = {
      id: user_id,
      data: {
        name: 'Rafael Aparecido legal',
        email: 'rafael@gmail.com',
      },
    };

    // Act
    const updated_user = await updateUserUseCase.execute(data);

    // Assert
    expect(updated_user).toBeInstanceOf(User);
    expect(updated_user.name).not.toBe('rafael ap');
    expect(updated_user.email).not.toBe('rafa.ap.ap.ap2003@gmail.com');
  });

  it('Should  throw an error if the user not found', async () => {
    // Arrange
    const data: IUserContract.UpdateParams = {
      id: 'user_id',
      data: {
        name: 'Rafael Aparecido legal',
        email: 'rafael@gmail.com',
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
        name: 'Rafael Aparecido legal',
        email: 'rafael@gmail.com',
      },
    };

    // Assert
    await expect(updateUserUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });
});
