// Mock do módulo env ANTES de qualquer import que o utilize
jest.mock('src/shared/config/env', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret-key',
    REFRESH_JWT_SECRET: 'test-refresh-jwt-secret',
    PORT: '3000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    CEP_SERVICE_API_URL: 'https://test-cep-api.com',
    CDN_URL: 'https://test-cdn.com',
    BUCKET_NAME: 'test-bucket',
    NODE_ENV: 'test',
  },
}));

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Organization } from 'src/core/domain/entities/organization';
import { PrismaService } from 'src/infra/database/database.service';
import { UserRepo } from 'src/modules/user/repo/user.repository';
import { UserService } from 'src/modules/user/user.service';
import {
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { OrganizationService } from '../../organization.service';
import { OrganizationRepo } from '../../repo/organization.repo';
import {
  CreateOrganizationParams,
  CreateOrganizationUseCase,
} from '../../usecases/CreateOrganizationUseCase';

describe('Create Org UseCase', () => {
  let createOrgUseCase: CreateOrganizationUseCase;
  let orgService: IOrganizationContract;
  let storageService: IStorageGw;
  let userService: IUserContract;
  let orgRepo: OrganizationRepo;
  let userRepo: UserRepo;
  let utilsService: IUtilsContract;
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
          provide: IUTILS_SERVICE,
          useValue: {
            verifyCepService: jest.fn(),
            validateHash: jest.fn(),
            generateHash: jest.fn(),
            getCepAddressInformations: jest.fn(),
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
        {
          provide: ISTORAGE_SERVICE,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getFileKey: jest.fn(),
          },
        },
      ],
    }).compile();

    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    userService = module.get<IUserContract>(IUSER_CONTRACT);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    userRepo = module.get<UserRepo>(UserRepo);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
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

  beforeEach(() => jest.clearAllMocks());

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
    expect(utilsService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(storageService).toBeDefined();
    expect(owner_id).toBeDefined();
  });

  it('Should create a new Organization', async () => {
    // Arrange
    const data: CreateOrganizationParams = {
      owner_id,
      data: {
        name: 'Restaurante Fogo de chão',
        email: 'contato@bemestar.com',
        description:
          'Clínica especializada em atendimento psicológico e terapias.',
        location_code: 'BR-MG-015',
        open_hour: 8,
        close_hour: 18,
        cep: '30130-010',
      },
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_password');
    jest.spyOn(utilsService, 'getCepAddressInformations').mockResolvedValue({
      cep: '12345-678',
      logradouro: 'Rua Exemplo',
      complemento: 'Apto 101',
      unidade: '',
      bairro: 'Centro',
      localidade: 'São Paulo',
      uf: 'SP',
      estado: 'São Paulo',
      regiao: 'Sudeste',
      ibge: '3550308',
      gia: '1004',
      ddd: '11',
      siafi: '7107',
    });
    jest
      .spyOn(storageService, 'uploadFile')
      .mockResolvedValue({ fileKey: 'file_key' });

    // Act
    const newOrg = await createOrgUseCase.execute(data);

    //Assert
    expect(utilsService.getCepAddressInformations).toHaveBeenCalledTimes(1);
    expect(utilsService.getCepAddressInformations).toHaveBeenCalledWith(
      data.data.cep,
    );
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    expect(storageService.uploadFile).toHaveBeenCalledTimes(0);
    expect(newOrg).toBeInstanceOf(Organization);
    expect(newOrg.owner_id).toBe(owner_id);
  });

  it('Should thrown an error if the owner not exists', async () => {
    // Arrange
    const data: CreateOrganizationParams = {
      owner_id: '1231313',
      data: {
        name: 'Restaurante Fogo de chão123123',
        email: 'contato@bemestar.com',
        description:
          'Clínica especializada em atendimento psicológico e terapias.',
        location_code: 'BR-MG-015',
        open_hour: 8,
        close_hour: 18,
        cep: '30130-010',
      },
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_password');

    //Assert
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createOrgUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should thrown an error if the org already exists', async () => {
    // Arrange
    const data: CreateOrganizationParams = {
      owner_id,
      data: {
        name: 'Restaurante Fogo de chão',
        email: 'contato@bemestar.com',
        description:
          'Clínica especializada em atendimento psicológico e terapias.',
        location_code: 'BR-MG-015',
        open_hour: 8,
        close_hour: 18,
        cep: '30130-010',
      },
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_password');

    //Assert
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    await expect(createOrgUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should upload a file and create the imageUrl if the image_file is provided', async () => {
    // Arrange
    const image_file = {
      originalname: 'logo.png',
      buffer: Buffer.from('file_buffer'),
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;
    const data: CreateOrganizationParams = {
      owner_id,
      data: {
        name: 'Restaurante Fogo de chão 123123',
        email: 'contato_novo@bemestar.com',
        description:
          'Clínica especializada em atendimento psicológico e terapias.',
        location_code: 'BR-MG-015',
        open_hour: 8,
        close_hour: 18,
        cep: '30132-012',
      },
      image_file,
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_password');
    jest
      .spyOn(storageService, 'getFileKey')
      .mockReturnValue('organization/file_key/logo.png');
    jest
      .spyOn(storageService, 'uploadFile')
      .mockResolvedValue({ fileKey: 'organization/file_key/logo.png' });

    // Act
    const newOrg = await createOrgUseCase.execute(data);

    //Assert
    expect(newOrg).toBeInstanceOf(Organization);
    expect(newOrg.image_url).toBeTruthy();
    expect(newOrg.owner_id).toBe(owner_id);
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    expect(storageService.uploadFile).toHaveBeenCalledTimes(1);
    expect(storageService.getFileKey).toHaveBeenCalledTimes(1);
    expect(storageService.getFileKey).toHaveBeenCalledWith({
      filename: image_file.originalname,
      orgId: newOrg.id,
    });
    expect(storageService.uploadFile).toHaveBeenCalledWith({
      fileBuffer: image_file.buffer,
      key: 'organization/file_key/logo.png',
      contentType: image_file.mimetype,
      size: image_file.size,
      orgId: newOrg.id,
    });
  });

  it('Should not Upload a file if the image_file is not provided', async () => {
    // Arrange
    const data: CreateOrganizationParams = {
      owner_id,
      data: {
        name: 'Restaurante Fogo de chão 893183109u1',
        email: 'contato_novo_2@bemestar.com',
        description:
          'Clínica especializada em atendimento psicológico e terapias.',
        location_code: 'BR-MG-015',
        open_hour: 8,
        close_hour: 18,
        cep: '30179-017',
      },
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_password');
    jest.spyOn(storageService, 'getFileKey').mockReturnValue('');
    jest.spyOn(storageService, 'uploadFile').mockResolvedValue({ fileKey: '' });

    // Act
    const newOrg = await createOrgUseCase.execute(data);

    //Assert
    expect(newOrg).toBeInstanceOf(Organization);
    expect(newOrg.image_url).toBeFalsy();
    expect(newOrg.owner_id).toBe(owner_id);
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    expect(storageService.uploadFile).toHaveBeenCalledTimes(0);
    expect(storageService.getFileKey).toHaveBeenCalledTimes(0);
  });
});
