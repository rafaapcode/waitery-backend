import { faker } from '@faker-js/faker';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { IAuthContract } from 'src/core/application/contracts/auth/IAuthContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { User } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { IAUTH_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';
import { AuthService } from '../../auth.service';
import { SignUpUseCase } from '../../usecases/SignUpUseCase';

describe('SignUp UseCase', () => {
  let signUpUseCase: SignUpUseCase;
  let authService: IAuthContract;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;

  const userName = faker.person.fullName();
  const userEmail = faker.internet.email();
  const userPassword = faker.internet.password({ length: 15 });
  const userCpf = faker.string.numeric(11);
  const token = faker.string.alphanumeric(128);
  const bcryptHash = faker.string.alphanumeric(60);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignUpUseCase,
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
          useValue: {
            verifyCepService: jest.fn(),
            validateHash: jest.fn(),
            generateHash: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(IAUTH_CONTRACT);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    signUpUseCase = module.get<SignUpUseCase>(SignUpUseCase);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(utilsService).toBeDefined();
    expect(authService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  it('Should signUp a valid user', async () => {
    // Arrange
    const data: IAuthContract.SignUpParams = {
      name: userName,
      email: userEmail,
      password: userPassword,
      cpf: userCpf,
    };
    jest.spyOn(jwtService, 'sign').mockImplementation(() => token);
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue(bcryptHash);

    // Act
    const newUser = await signUpUseCase.execute(data, '', '');

    // Assert
    expect(newUser.user.id).toBeDefined();
    expect(newUser.user).toBeInstanceOf(User);
    expect(newUser.access_token).toBe(token);
    expect(newUser.user.password).toBe(bcryptHash);
    expect(jwtService.sign).toHaveBeenCalledTimes(1);
    expect(jwtService.sign).toHaveBeenCalledWith({
      ...newUser.user.fromEntity(),
      user_agent: '',
      ip_address: '',
    });
    expect(utilsService.generateHash).toHaveBeenCalledTimes(1);
    expect(utilsService.generateHash).toHaveBeenCalledWith(data.password);
  });

  it('Should throw an Conflict Error when try to signUp a existent user', async () => {
    // Arrange
    const data: IAuthContract.SignUpParams = {
      name: userName,
      email: userEmail,
      password: userPassword,
      cpf: userCpf,
    };
    jest.spyOn(jwtService, 'sign').mockImplementation(() => token);
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue(bcryptHash);

    // Assert
    await expect(signUpUseCase.execute(data, '', '')).rejects.toThrow(
      ConflictException,
    );
    expect(jwtService.sign).toHaveBeenCalledTimes(0);
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
  });
});
