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
import { AuthService } from '../../auth.service';

describe('AuthService - SignIn', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let utilsService: IUtilsContract;
  const token: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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
  });

  it('All services must be defined', () => {
    expect(authService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should signIn a valid user', async () => {
    // Arrange
    const data: IAuthContract.SignInParams = {
      email: 'rafinha@gmail.com',
      password: 'qweasdzxczxcasdqwe',
    };
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
      name: 'Rafael',
      id: '1J0PV7ZZ7FFM12SSPPRFP2E0W',
      email: 'rafinha@gmail.com',
      cpf: '11111111111',
      password: 'hashBcrypt',
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
      email: 'rafinha@gmail.com',
      password: 'qweasdzxczxcasdqwe',
    };
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

    // Assert
    await expect(authService.signIn(data)).rejects.toThrow(NotFoundException);
  });

  it('Should throw if the password is incorrect', async () => {
    // Arrange
    const data: IAuthContract.SignInParams = {
      email: 'rafinha@gmail.com',
      password: 'qweasdzxczxcasdqwe',
    };
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
      name: 'Rafael',
      id: '1J0PV7ZZ7FFM12SSPPRFP2E0W',
      email: 'rafinha@gmail.com',
      cpf: '11111111111',
      password: 'hashBcrypt',
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
  const token: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
  const hashBcrypt: string =
    '$2a$12$8pnK6AuwIdw.4cFuGQO0j.pxhwT17UXlYO7Lw80uVq0UgrXNo1.wG';
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
      name: 'rafael aparecido',
      email: 'rafinha@gmail.com',
      password: 'qweasdzxczxcasdqwe',
      cpf: '12345678910',
    };
    jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);
    jest.spyOn(prismaService.user, 'create').mockResolvedValue({
      name: 'Rafael',
      id: '1J0PV7ZZ7FFM12SSPPRFP2E0W',
      email: 'rafinha@gmail.com',
      cpf: '11111111111',
      password: 'hashBcrypt',
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
    expect(signUpUser.user.id).toBe('1J0PV7ZZ7FFM12SSPPRFP2E0W');
    expect(signUpUser.user.password).toBe(hashBcrypt);
    expect(signUpUser.access_token).toBe(token);
  });

  it('Should throw an ConflictException if the user already exists', async () => {
    // Arrange
    const data: IAuthContract.SignUpParams = {
      name: 'rafael aparecido',
      email: 'rafinha@gmail.com',
      password: 'qweasdzxczxcasdqwe',
      cpf: '12345678910',
    };
    jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue({
      name: 'Rafael',
      id: '1J0PV7ZZ7FFM12SSPPRFP2E0W',
      email: 'rafinha@gmail.com',
      cpf: '11111111111',
      password: 'hashBcrypt',
      role: UserRole.OWNER,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Assert
    await expect(authService.signUp(data)).rejects.toThrow(ConflictException);
  });
});
