import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { Organization } from 'src/core/domain/entities/organization';
import { HashService } from 'src/hash.service';
import { PrismaService } from 'src/infra/database/database.service';
import { UserRepo } from 'src/modules/user/repo/user.repository';
import { UserService } from 'src/modules/user/user.service';
import { IORGANIZATION_CONTRACT, IUSER_CONTRACT } from 'src/shared/constants';
import { OrganizationService } from '../../organization.service';
import { OrganizationRepo } from '../../repo/organization.repo';
import { CreateOrganizationUseCase } from '../../usecases/CreateOrganizationUseCase';

describe('Create Org UseCase', () => {
  let createOrgUseCase: CreateOrganizationUseCase;
  let orgService: IOrganizationContract;
  let userService: IUserContract;
  let orgRepo: OrganizationRepo;
  let userRepo: UserRepo;
  let hashService: HashService;
  let prismaService: PrismaService;
  let owner_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrganizationUseCase,
        UserRepo,
        OrganizationRepo,
        PrismaService,
        {
          provide: HashService,
          useValue: {
            generateHash: jest.fn(),
          },
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
        {
          provide: IUSER_CONTRACT,
          useClass: UserService,
        },
      ],
    }).compile();

    orgService = module.get<OrganizationService>(IORGANIZATION_CONTRACT);
    userService = module.get<UserService>(IUSER_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    userRepo = module.get<UserRepo>(UserRepo);
    hashService = module.get<HashService>(HashService);
    prismaService = module.get<PrismaService>(PrismaService);
    createOrgUseCase = module.get<CreateOrganizationUseCase>(
      CreateOrganizationUseCase,
    );

    const { id } = await prismaService.user.create({
      data: {
        cpf: '1111111111',
        email: 'teste@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: 'OWNER',
      },
    });
    owner_id = id;
  });

  afterAll(async () => {
    await prismaService.user.delete({ where: { email: 'teste@gmail.com' } });
    await prismaService.organization.deleteMany({
      where: { email: 'contato@bemestar.com' },
    });
  });

  it('Should be all services defined', () => {
    expect(orgService).toBeDefined();
    expect(userService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(hashService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(owner_id).toBeDefined();
  });

  it('Should create a new Organization', async () => {
    // Arrange
    const data: IOrganizationContract.CreateParams = {
      owner_id,
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
      },
    };
    jest.spyOn(hashService, 'generateHash').mockResolvedValue('hash_password');

    // Act
    const newOrg = await createOrgUseCase.execute(data);

    //Assert
    expect(hashService.generateHash).toHaveBeenCalledTimes(0);
    expect(newOrg).toBeInstanceOf(Organization);
    expect(newOrg.owner_id).toBe(owner_id);
  });

  it('Should thrown an error if the owner not exists', async () => {
    // Arrange
    const data: IOrganizationContract.CreateParams = {
      owner_id: '1231313',
      data: {
        name: 'Restaurante Fogo de chão123123',
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
      },
    };
    jest.spyOn(hashService, 'generateHash').mockResolvedValue('hash_password');

    //Assert
    expect(hashService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createOrgUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should thrown an error if the org already exists', async () => {
    // Arrange
    const data: IOrganizationContract.CreateParams = {
      owner_id,
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
      },
    };
    jest.spyOn(hashService, 'generateHash').mockResolvedValue('hash_password');

    //Assert
    expect(hashService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createOrgUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });
});
