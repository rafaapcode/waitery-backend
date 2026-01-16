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

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { Organization } from 'src/core/domain/entities/organization';
import { PrismaService } from 'src/infra/database/database.service';
import { UserRepo } from 'src/modules/user/repo/user.repository';
import {
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { OrganizationService } from '../../organization.service';
import { OrganizationRepo } from '../../repo/organization.repo';
import { GetOrganizationUseCase } from '../../usecases/GetOrganizationUseCase';

describe('Get Org UseCase', () => {
  let getOrgUseCase: GetOrganizationUseCase;
  let orgService: IOrganizationContract;
  let storageService: IStorageGw;
  let orgRepo: OrganizationRepo;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  const owner_id = 'testestes123131';
  let org_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrganizationUseCase,
        UserRepo,
        OrganizationRepo,
        PrismaService,
        {
          provide: IUTILS_SERVICE,
          useValue: {
            verifyCepService: jest.fn(),
            validateHash: jest.fn(),
            generateHash: jest.fn(),
          },
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
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
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    userRepo = module.get<UserRepo>(UserRepo);
    prismaService = module.get<PrismaService>(PrismaService);
    getOrgUseCase = module.get<GetOrganizationUseCase>(GetOrganizationUseCase);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);

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
        owner_id,
      },
    });

    org_id = id;
  });

  afterAll(async () => {
    await prismaService.organization.delete({
      where: {
        id: org_id,
      },
    });
  });

  it('Should be all services defined', () => {
    expect(getOrgUseCase).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should get a organization', async () => {
    // Act
    const org = await getOrgUseCase.execute(org_id, owner_id);

    // Assert
    expect(org).toBeInstanceOf(Organization);
  });

  it('Should throw an error if the owner is not associated with the organization', async () => {
    // Assert
    await expect(getOrgUseCase.execute(org_id, 'owner_id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw an error if the org not exist', async () => {
    // Assert
    await expect(getOrgUseCase.execute('org_id', owner_id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
