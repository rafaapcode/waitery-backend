import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { IAuthContract } from 'src/core/application/contracts/auth/IAuthContract';
import { User } from 'src/core/domain/entities/user';
import { HashService } from 'src/hash.service';
import { PrismaService } from 'src/infra/database/database.service';
import { IAUTH_CONTRACT } from 'src/shared/constants';
import { AuthService } from '../../auth.service';
import { SignInUseCase } from '../../usecases/SignInUseCase';

describe('SignIn UseCase', () => {
  let signInUseCase: SignInUseCase;
  let authService: IAuthContract;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let hashService: HashService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignInUseCase,
        PrismaService,
        HashService,
        {
          provide: IAUTH_CONTRACT,
          useClass: AuthService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(IAUTH_CONTRACT);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
    hashService = module.get<HashService>(HashService);
    signInUseCase = module.get<SignInUseCase>(SignInUseCase);

    await prismaService.user.create({
      data: {
        cpf: '1111111111',
        email: 'teste@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: 'OWNER',
      },
    });
  }, 15000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prismaService.user.delete({
      where: {
        email: 'teste@gmail.com',
      },
    });
  }, 15000);

  it('Should all services be defined', () => {
    expect(hashService).toBeDefined();
    expect(authService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  it('Should signIn a valid user', async () => {
    // Arrange
    const data: IAuthContract.SignInParams = {
      email: 'teste@gmail.com',
      password: 'qweasdzxc2003',
    };
    jest.spyOn(jwtService, 'sign').mockImplementation(() => 'token_qualquer');

    // Act
    const user_signedIn = await signInUseCase.execute(data);

    // Asssert
    expect(user_signedIn.access_token).toBe('token_qualquer');
    expect(user_signedIn.user).toBeInstanceOf(User);
    expect(user_signedIn.user.id).toBeTruthy();
    expect(jwtService.sign).toHaveBeenCalledTimes(1);
    expect(jwtService.sign).toHaveBeenCalledWith(
      user_signedIn.user.fromEntity(),
    );
  });

  it('Should not signIn a user that dont exists', async () => {
    // Arrange
    const data: IAuthContract.SignInParams = {
      email: 'teste123@gmail.com',
      password: 'qweasdzxc2003',
    };
    jest.spyOn(jwtService, 'sign').mockImplementation(() => 'token_qualquer');

    // Asssert
    expect(jwtService.sign).toHaveBeenCalledTimes(0);
    await expect(signInUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should not signIn a user with wrong password', async () => {
    // Arrange
    const data: IAuthContract.SignInParams = {
      email: 'teste@gmail.com',
      password: 'qweasdzxc2003123123',
    };
    jest.spyOn(jwtService, 'sign').mockImplementation(() => 'token_qualquer');

    // Asssert
    expect(jwtService.sign).toHaveBeenCalledTimes(0);
    await expect(signInUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });
});
