import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { User, UserRole } from 'src/core/domain/entities/user';
import { HashService } from 'src/hash.service';
import { PrismaService } from 'src/infra/database/database.service';
import { IUSER_CONTRACT } from 'src/shared/constants';
import { UserRepo } from '../../repo/user.repository';
import { GetUserUseCase } from '../../usecases/GetUserUseCase';
import { UserService } from '../../user.service';

describe('Get User UseCase', () => {
  let getUserUseCase: GetUserUseCase;
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
        GetUserUseCase,
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
    getUserUseCase = module.get<GetUserUseCase>(GetUserUseCase);
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
        email: 'rafa.ap.ap.ap2003@gmail.com',
      },
    });
  });

  it('Should all services be defined', () => {
    expect(getUserUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(hashService).toBeDefined();
    expect(user_id).toBeDefined();
  });

  it('Should return a user', async () => {
    // Act
    const currentUser = await getUserUseCase.execute(user_id);

    // Assert
    expect(currentUser).toBeInstanceOf(User);
  });

  it('Should throw an error if the user not exist', async () => {
    // Assert
    await expect(getUserUseCase.execute('user_id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
