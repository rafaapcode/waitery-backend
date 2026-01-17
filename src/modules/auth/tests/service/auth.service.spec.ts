import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { IAuthContract } from 'src/core/application/contracts/auth/IAuthContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { IUTILS_SERVICE } from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { AuthService } from '../../auth.service';

describe('AuthService - SignIn', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let utilsService: IUtilsContract;
  let factorieService: FactoriesService;

  const token = faker.string.alphanumeric(128);
  const userName = faker.person.fullName();
  const userId = faker.string.uuid();
  const userEmail = faker.internet.email();
  const userCpf = faker.string.numeric(11);
  const userPassword = faker.internet.password({ length: 15 });
  const hashBcrypt = faker.string.alphanumeric(60);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        AuthService,
        FactoriesService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
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
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    factorieService = module.get<FactoriesService>(FactoriesService);
  });

  it('All services must be defined', () => {
    expect(authService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(factorieService).toBeDefined();
  });

  it('Should signIn a valid user', async () => {
    // Arrange
    const data: IAuthContract.SignInParams = {
      email: userEmail,
      password: userPassword,
    };
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
      name: userName,
      id: userId,
      email: userEmail,
      cpf: userCpf,
      password: hashBcrypt,
      role: UserRole.OWNER,
      created_at: new Date(),
      updated_at: new Date(),
    });
    jest.spyOn(utilsService, 'validateHash').mockResolvedValue(true);
    jest.spyOn(jwtService, 'sign').mockImplementation(() => token);

    // Act
    const signInUser = await authService.signIn(data);

    // Assert
    expect(utilsService.validateHash).toHaveBeenCalledTimes(1);
    expect(jwtService.sign).toHaveBeenCalledTimes(1);
    expect(jwtService.sign).toHaveBeenCalledWith(signInUser.user.fromEntity());
    expect(signInUser.user).toBeDefined();
    expect(signInUser.user.password).toBeUndefined();
    expect(signInUser.access_token).toBe(token);
  });

  it('Should throw if a user dont exist', async () => {
    // Arrange
    const data: IAuthContract.SignInParams = {
      email: userEmail,
      password: userPassword,
    };
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

    // Assert
    await expect(authService.signIn(data)).rejects.toThrow(NotFoundException);
  });

  it('Should throw if the password is incorrect', async () => {
    // Arrange
    const data: IAuthContract.SignInParams = {
      email: userEmail,
      password: userPassword,
    };
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
      name: userName,
      id: userId,
      email: userEmail,
      cpf: userCpf,
      password: hashBcrypt,
      role: UserRole.OWNER,
      created_at: new Date(),
      updated_at: new Date(),
    });
    jest.spyOn(utilsService, 'validateHash').mockResolvedValue(false);

    // Assert
    await expect(authService.signIn(data)).rejects.toThrow(BadRequestException);
  });
});

describe('AuthService - SignUp', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let utilsService: IUtilsContract;

  const token = faker.string.alphanumeric(128);
  const hashBcrypt = faker.string.alphanumeric(60);
  const userName = faker.person.fullName();
  const userId = faker.string.uuid();
  const userEmail = faker.internet.email();
  const userCpf = faker.string.numeric(11);
  const userPassword = faker.internet.password({ length: 15 });
  const signUpName = faker.person.fullName();
  const signUpCpf = faker.string.numeric(11);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
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
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
  });

  it('All services must be defined', () => {
    expect(authService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should signUp a valid user', async () => {
    // Arrange
    const data: IAuthContract.SignUpParams = {
      name: signUpName,
      email: userEmail,
      password: userPassword,
      cpf: signUpCpf,
    };
    jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);
    jest.spyOn(prismaService.user, 'create').mockResolvedValue({
      name: userName,
      id: userId,
      email: userEmail,
      cpf: userCpf,
      password: hashBcrypt,
      role: UserRole.OWNER,
      created_at: new Date(),
      updated_at: new Date(),
    });
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue(hashBcrypt);
    jest.spyOn(jwtService, 'sign').mockImplementation(() => token);

    // Act
    const signUpUser = await authService.signUp(data);

    // Assert
    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: {
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        password: hashBcrypt,
        role: UserRole.OWNER,
      },
    });
    expect(utilsService.generateHash).toHaveBeenCalledTimes(1);
    expect(utilsService.generateHash).toHaveBeenCalledWith(data.password);
    expect(jwtService.sign).toHaveBeenCalledTimes(1);
    expect(jwtService.sign).toHaveBeenCalledWith(signUpUser.user.fromEntity());
    expect(signUpUser.user).toBeDefined();
    expect(signUpUser.user.id).toBe(userId);
    expect(signUpUser.user.password).toBe(hashBcrypt);
    expect(signUpUser.access_token).toBe(token);
  });

  it('Should throw an ConflictException if the user already exists', async () => {
    // Arrange
    const data: IAuthContract.SignUpParams = {
      name: signUpName,
      email: userEmail,
      password: userPassword,
      cpf: signUpCpf,
    };
    jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue({
      name: userName,
      id: userId,
      email: userEmail,
      cpf: userCpf,
      password: hashBcrypt,
      role: UserRole.OWNER,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Assert
    await expect(authService.signUp(data)).rejects.toThrow(ConflictException);
  });
});
