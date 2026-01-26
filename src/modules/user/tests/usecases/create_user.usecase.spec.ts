import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { User, UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { UserRepo } from '../../repo/user.repository';
import { CreateUserUseCase } from '../../usecases/CreateUserUseCase';
import { UserService } from '../../user.service';

describe('Create User UseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let organizationService: IOrganizationContract;
  let organizationRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;
  let org_id: string;
  let user_id: string;
  let storageService: IStorageGw;
  let factoriesService: FactoriesService;

  const hashPassword =
    '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u';
  const newUserCpf = faker.string.numeric(11);
  const newUserName = faker.person.fullName();
  const newUserEmail = faker.internet.email();
  const newUserPassword = faker.internet.password();
  const conflictCpf = faker.string.numeric(11);
  const conflictEmail = faker.internet.email();
  const fakeOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        UserRepo,
        PrismaService,
        CreateUserUseCase,
        OrganizationRepo,
        {
          provide: IUTILS_SERVICE,
          useValue: {
            generateHash: jest.fn(),
          },
        },
        {
          provide: IUSER_CONTRACT,
          useClass: UserService,
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
        {
          provide: ISTORAGE_SERVICE,
          useValue: {
            deleteFile: jest.fn(),
            getFileUrl: jest.fn(),
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<IUserContract>(IUSER_CONTRACT);
    userRepo = module.get<UserRepo>(UserRepo);
    organizationService = module.get<IOrganizationContract>(
      IORGANIZATION_CONTRACT,
    );
    organizationRepo = module.get<OrganizationRepo>(OrganizationRepo);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    prismaService = module.get<PrismaService>(PrismaService);
    createUserUseCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    const org = await factoriesService.generateOrganizationWithOwner();

    await prismaService.userOrg.create({
      data: {
        org_id: org.organization.id,
        user_id: org.owner.id,
      },
    });

    org_id = org.organization.id;
    user_id = org.owner.id;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(async () => {
    await prismaService.userOrg.deleteMany({});
    await prismaService.user.deleteMany({});
    await prismaService.organization.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(createUserUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(organizationService).toBeDefined();
    expect(organizationRepo).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(user_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should create a new user', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: newUserCpf,
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: UserRole.ADMIN,
      },
      org_id,
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue(hashPassword);

    // Act
    const user = await createUserUseCase.execute(data);

    // Assert
    expect(user).toBeInstanceOf(User);
    expect(utilsService.generateHash).toHaveBeenCalledTimes(1);
    expect(user.password).toBe(hashPassword);
  });

  it('Should throw an error if the user already exists (email)', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: conflictCpf,
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: UserRole.ADMIN,
      },
      org_id,
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue(hashPassword);

    // Assert
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createUserUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should throw an error if the user already exists (CPF)', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: newUserCpf,
        name: newUserName,
        email: conflictEmail,
        password: newUserPassword,
        role: UserRole.ADMIN,
      },
      org_id,
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue(hashPassword);

    // Assert
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createUserUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should throw an error if the org_id is not provided', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: conflictCpf,
        name: newUserName,
        email: conflictEmail,
        password: newUserPassword,
        role: UserRole.ADMIN,
      },
      org_id: '',
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue(hashPassword);

    // Assert
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createUserUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw an error if the role of the new user is a OWNER', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: conflictCpf,
        name: newUserName,
        email: conflictEmail,
        password: newUserPassword,
        role: UserRole.OWNER,
      },
      org_id,
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue(hashPassword);

    // Assert
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createUserUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should throw an error if the org does not exists', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: conflictCpf,
        name: newUserName,
        email: conflictEmail,
        password: newUserPassword,
        role: UserRole.ADMIN,
      },
      org_id: fakeOrgId,
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue(hashPassword);

    // Assert
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createUserUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw an error if the user is trying to create a new OWNER', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: conflictCpf,
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: UserRole.OWNER,
      },
      org_id,
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue(hashPassword);

    // Assert
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createUserUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });
});
