import { faker } from '@faker-js/faker';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { IAuthContract } from 'src/core/application/contracts/auth/IAuthContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { User } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { IAUTH_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';
import { UtilsService } from 'src/utils.service';
import { AuthService } from '../../auth.service';
import { SignInUseCase } from '../../usecases/SignInUseCase';

describe('SignIn UseCase', () => {
  let signInUseCase: SignInUseCase;
  let authService: IAuthContract;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;

  const userCpf = faker.string.numeric(11);
  const userEmail = faker.internet.email();
  const userPassword = faker.internet.password({ length: 15 });
  const token = faker.string.alphanumeric(128);
  const nonExistentEmail = faker.internet.email();
  const wrongPassword = faker.internet.password({ length: 20 });
  let hashedPassword: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignInUseCase,
        PrismaService,
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
        {
          provide: IUTILS_SERVICE,
          useClass: UtilsService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(IAUTH_CONTRACT);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    signInUseCase = module.get<SignInUseCase>(SignInUseCase);

    hashedPassword = await utilsService.generateHash(userPassword);

    await prismaService.user.create({
      data: {
        cpf: userCpf,
        email: userEmail,
        password: hashedPassword,
        role: 'OWNER',
      },
    });
  }, 15000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
  }, 15000);

  it('Should all services be defined', () => {
    expect(utilsService).toBeDefined();
    expect(authService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  it('Should signIn a valid user', async () => {
    // Arrange
    const data: IAuthContract.SignInParams = {
      email: userEmail,
      password: userPassword,
    };
    jest.spyOn(jwtService, 'sign').mockImplementation(() => token);

    // Act
    const user_signedIn = await signInUseCase.execute(data);

    // Asssert
    expect(user_signedIn.access_token).toBe(token);
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
      email: nonExistentEmail,
      password: userPassword,
    };
    jest.spyOn(jwtService, 'sign').mockImplementation(() => token);

    // Asssert
    expect(jwtService.sign).toHaveBeenCalledTimes(0);
    await expect(signInUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should not signIn a user with wrong password', async () => {
    // Arrange
    const data: IAuthContract.SignInParams = {
      email: userEmail,
      password: wrongPassword,
    };
    jest.spyOn(jwtService, 'sign').mockImplementation(() => token);

    // Asssert
    expect(jwtService.sign).toHaveBeenCalledTimes(0);
    await expect(signInUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });
});
