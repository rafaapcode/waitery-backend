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
    await prismaService.user.delete({
      where: { email: 'rafinha123@gmail.com' },
    });
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
      name: 'rafael aparecido',
      email: 'rafinha123@gmail.com',
      password: 'qweasdzxczxcasdqwe',
      cpf: '12345678910',
    };
    jest.spyOn(jwtService, 'sign').mockImplementation(() => 'token_qualquer');
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('bcrypt_hash');

    // Act
    const newUser = await signUpUseCase.execute(data);

    // Assert
    expect(newUser.user.id).toBeDefined();
    expect(newUser.user).toBeInstanceOf(User);
    expect(newUser.access_token).toBe('token_qualquer');
    expect(newUser.user.password).toBe('bcrypt_hash');
    expect(jwtService.sign).toHaveBeenCalledTimes(1);
    expect(jwtService.sign).toHaveBeenCalledWith(newUser.user.fromEntity());
    expect(utilsService.generateHash).toHaveBeenCalledTimes(1);
    expect(utilsService.generateHash).toHaveBeenCalledWith(data.password);
  });

  it('Should throw an Conflict Error when try to signUp a existent user', async () => {
    // Arrange
    const data: IAuthContract.SignUpParams = {
      name: 'rafael aparecido',
      email: 'rafinha123@gmail.com',
      password: 'qweasdzxczxcasdqwe',
      cpf: '12345678910',
    };
    jest.spyOn(jwtService, 'sign').mockImplementation(() => 'token_qualquer');
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('bcrypt_hash');

    // Assert
    await expect(signUpUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
    expect(jwtService.sign).toHaveBeenCalledTimes(0);
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
  });
});
