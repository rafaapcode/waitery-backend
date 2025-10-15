import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { User, UserRole } from 'src/core/domain/entities/user';
import { HashService } from 'src/hash.service';
import { PrismaService } from 'src/infra/database/database.service';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import { IORGANIZATION_CONTRACT, IUSER_CONTRACT } from 'src/shared/constants';
import { UserRepo } from '../../repo/user.repository';
import { CreateUserUseCase } from '../../usecases/CreateUserUseCase';
import { UserService } from '../../user.service';

describe('Create User UseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let organizationService: IOrganizationContract;
  let organizationRepo: OrganizationRepo;
  let hashService: HashService;
  let prismaService: PrismaService;
  let org_id: string;
  let user_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepo,
        PrismaService,
        CreateUserUseCase,
        OrganizationRepo,
        {
          provide: HashService,
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
      ],
    }).compile();

    userService = module.get<IUserContract>(IUSER_CONTRACT);
    userRepo = module.get<UserRepo>(UserRepo);
    organizationService = module.get<IOrganizationContract>(
      IORGANIZATION_CONTRACT,
    );
    organizationRepo = module.get<OrganizationRepo>(OrganizationRepo);
    hashService = module.get<HashService>(HashService);
    prismaService = module.get<PrismaService>(PrismaService);
    createUserUseCase = module.get<CreateUserUseCase>(CreateUserUseCase);

    const user = await prismaService.user.create({
      data: {
        cpf: '22222222222',
        name: 'rafael ap',
        email: 'rafaap@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: UserRole.OWNER,
      },
    });

    const { id } = await prismaService.organization.create({
      data: {
        name: 'Restaurante Fogo de chão',
        image_url: 'https://example.com/images/clinica.jpg',
        email: 'contato@bemestar.com',
        description:
          'Clínica especializada em atendimento psicológico e terapias.',
        location_code: 'BR-MG-015',
        open_hour: 8,
        close_hour: 18,
        cep: '30130-010',
        city: 'Belo Horizonte',
        neighborhood: 'Funcionários',
        street: 'Rua da Bahia, 1200',
        lat: -19.92083,
        long: -43.937778,
        owner_id: user.id,
      },
    });

    await prismaService.userOrg.create({
      data: {
        org_id: id,
        user_id: user.id,
      },
    });

    org_id = id;
    user_id = user.id;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(async () => {
    await prismaService.userOrg.deleteMany({
      where: {
        org_id,
      },
    });

    await prismaService.user.deleteMany({
      where: {
        email: {
          in: [
            'rafaap@gmail.com',
            'teste32131@gmail.com',
            'rafaap2013131@gmail.com',
          ],
        },
      },
    });

    await prismaService.organization.delete({
      where: {
        id: org_id,
      },
    });
  });

  it('Should all services be defined', () => {
    expect(createUserUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(organizationService).toBeDefined();
    expect(organizationRepo).toBeDefined();
    expect(hashService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(user_id).toBeDefined();
  });

  it('Should create a new user', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: '1111111111',
        name: 'rafael teste',
        email: 'teste32131@gmail.com',
        password: 'qweasdzxc2003', // qweasdzxc2003
        role: UserRole.ADMIN,
      },
      org_id,
    };
    jest.spyOn(hashService, 'generateHash').mockResolvedValue('hash_password');

    // Act
    const user = await createUserUseCase.execute(data);

    // Assert
    expect(user).toBeInstanceOf(User);
    expect(hashService.generateHash).toHaveBeenCalledTimes(1);
    expect(user.password).toBe('hash_password');
  });

  it('Should throw an error if the user already exists (email)', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: '55555555555',
        name: 'rafael teste',
        email: 'teste32131@gmail.com',
        password: 'qweasdzxc2003', // qweasdzxc2003
        role: UserRole.ADMIN,
      },
      org_id,
    };
    jest.spyOn(hashService, 'generateHash').mockResolvedValue('hash_password');

    // Assert
    expect(hashService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createUserUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should throw an error if the user already exists (CPF)', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: '1111111111',
        name: 'rafael teste',
        email: 'rafaap2013131@gmail.com',
        password: 'qweasdzxc2003', // qweasdzxc2003
        role: UserRole.ADMIN,
      },
      org_id,
    };
    jest.spyOn(hashService, 'generateHash').mockResolvedValue('hash_password');

    // Assert
    expect(hashService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createUserUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should throw an error if the org_id is not provided', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: '55555555555',
        name: 'rafael teste',
        email: 'rafaap2013131@gmail.com',
        password: 'qweasdzxc2003', // qweasdzxc2003
        role: UserRole.ADMIN,
      },
      org_id: '',
    };
    jest.spyOn(hashService, 'generateHash').mockResolvedValue('hash_password');

    // Assert
    expect(hashService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createUserUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw an error if the role of the new user is a OWNER', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: '55555555555',
        name: 'rafael teste',
        email: 'rafaap2013131@gmail.com',
        password: 'qweasdzxc2003', // qweasdzxc2003
        role: UserRole.OWNER,
      },
      org_id,
    };
    jest.spyOn(hashService, 'generateHash').mockResolvedValue('hash_password');

    // Assert
    expect(hashService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createUserUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should throw an error if the org does not exists', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: '55555555555',
        name: 'rafael teste',
        email: 'rafaap2013131@gmail.com',
        password: 'qweasdzxc2003', // qweasdzxc2003
        role: UserRole.ADMIN,
      },
      org_id: 'org_id123123',
    };
    jest.spyOn(hashService, 'generateHash').mockResolvedValue('hash_password');

    // Assert
    expect(hashService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createUserUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });
});
