import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { UserRole } from 'src/core/domain/entities/user';
import { HashService } from 'src/hash.service';
import { PrismaService } from 'src/infra/database/database.service';
import { IUSER_CONTRACT } from 'src/shared/constants';
import { UserRepo } from '../../repo/user.repository';
import { DeleteUserUseCase } from '../../usecases/DeleteUserUseCase';
import { UserService } from '../../user.service';

describe('Delete User UseCase', () => {
  let deleteUserUseCase: DeleteUserUseCase;
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
        DeleteUserUseCase,
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

    userService = module.get<UserService>(IUSER_CONTRACT);
    userRepo = module.get<UserRepo>(UserRepo);
    prismaService = module.get<PrismaService>(PrismaService);
    deleteUserUseCase = module.get<DeleteUserUseCase>(DeleteUserUseCase);
    hashService = module.get<HashService>(HashService);

    const { id } = await prismaService.user.create({
      data: {
        cpf: '22222222222',
        name: 'rafael ap',
        email: 'rafaap@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
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
    expect(hashService).toBeDefined();
    expect(user_id).toBeDefined();
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
