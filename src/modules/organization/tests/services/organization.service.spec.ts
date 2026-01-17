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

import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import {
  createOganizationEntity,
  Organization,
} from 'src/core/domain/entities/organization';
import { ISTORAGE_SERVICE, IUTILS_SERVICE } from 'src/shared/constants';
import { ulid } from 'ulid';
import { OrganizationService } from '../../organization.service';
import { OrganizationRepo } from '../../repo/organization.repo';

describe('OrganizationService', () => {
  let orgService: OrganizationService;
  let orgrepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let storageService: IStorageGw;
  const org: Organization = createOganizationEntity({
    description: faker.person.bio(),
    email: faker.internet.email(),
    cep: faker.location.zipCode(),
    name: faker.company.name(),
    image_url: faker.image.url(),
    location_code: faker.location.zipCode(),
    street: faker.location.street(),
    neighborhood: faker.location.street(),
    close_hour: Number(23),
    open_hour: Number(8),
    owner_id: 'data.owner_id',
    city: faker.location.city(),
    lat: 0,
    long: 0,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: OrganizationRepo,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            get: jest.fn(),
            getAll: jest.fn(),
            verifyOrgById: jest.fn(),
            verifyOrgByName: jest.fn(),
          },
        },
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
          provide: ISTORAGE_SERVICE,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getFileKey: jest.fn(),
          },
        },
      ],
    }).compile();

    orgService = module.get<OrganizationService>(OrganizationService);
    orgrepo = module.get<OrganizationRepo>(OrganizationRepo);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
  });

  it('All services must be defined', () => {
    expect(orgService).toBeDefined();
    expect(orgrepo).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should create an organization', async () => {
    // Arrange
    const mockedData = {
      id: ulid(),
      cep: faker.location.zipCode(),
      city: faker.location.city(),
      close_hour: 23,
      name: faker.company.name(),
      description: faker.person.bio(),
      email: faker.internet.email(),
      image_url: faker.image.url(),
      lat: faker.location.latitude(),
      long: faker.location.longitude(),
      open_hour: 8,
      location_code: faker.location.buildingNumber(),
      neighborhood: faker.location.street(),
      street: faker.location.street(),
    };
    const orgData: IOrganizationContract.CreateParams = {
      data: mockedData,
      owner_id: 'owner_id',
    };

    jest.spyOn(orgrepo, 'create').mockResolvedValue({
      ...mockedData,
      owner_id: 'owner_id',
    });

    // Act
    const org = await orgService.create(orgData);

    // Assert
    expect(orgrepo.create).toHaveBeenCalledTimes(1);
    expect(orgrepo.create).toHaveBeenCalledWith(orgData);
    expect(org).toBeInstanceOf(Organization);
  });

  it('Should update an organization', async () => {
    // Arrange
    const mockedData = {
      cep: faker.location.zipCode(),
      city: faker.location.city(),
      close_hour: 23,
      name: faker.company.name(),
      description: faker.person.bio(),
      email: faker.internet.email(),
      image_url: faker.image.url(),
      lat: faker.location.latitude(),
      long: faker.location.longitude(),
      open_hour: 8,
      location_code: faker.location.buildingNumber(),
      neighborhood: faker.location.street(),
      street: faker.location.street(),
    };
    const orgData: IOrganizationContract.UpdateParams = {
      data: mockedData,
      id: 'owner_id',
    };

    jest.spyOn(orgrepo, 'update').mockResolvedValue({
      ...mockedData,
      id: ulid(),
      owner_id: 'owner_id',
    });

    // Act
    const org = await orgService.update(orgData);

    // Assert
    expect(orgrepo.update).toHaveBeenCalledTimes(1);
    expect(orgrepo.update).toHaveBeenCalledWith(orgData);
    expect(org).toBeInstanceOf(Organization);
  });

  it('Should delete an organization', async () => {
    // Arrange
    const orgData: IOrganizationContract.DeleteParams = {
      id: 'owner_id',
    };

    jest.spyOn(orgrepo, 'delete').mockResolvedValue();

    // Act
    await orgService.delete(orgData);

    // Assert
    expect(orgrepo.delete).toHaveBeenCalledTimes(1);
    expect(orgrepo.delete).toHaveBeenCalledWith(orgData);
  });

  it('Should get an valid organization', async () => {
    // Arrange
    const orgData: IOrganizationContract.GetParams = {
      id: 'owner_id',
    };

    jest.spyOn(orgrepo, 'get').mockResolvedValue({
      id: ulid(),
      cep: faker.location.zipCode(),
      city: faker.location.city(),
      close_hour: 23,
      name: faker.company.name(),
      description: faker.person.bio(),
      email: faker.internet.email(),
      image_url: faker.image.url(),
      lat: faker.location.latitude(),
      long: faker.location.longitude(),
      open_hour: 8,
      location_code: faker.location.buildingNumber(),
      neighborhood: faker.location.street(),
      street: faker.location.street(),
      owner_id: 'owner_id',
    });

    // Act
    const org = await orgService.get(orgData);

    // Assert
    expect(orgrepo.get).toHaveBeenCalledTimes(1);
    expect(orgrepo.get).toHaveBeenCalledWith(orgData);
    expect(org).toBeInstanceOf(Organization);
  });

  it('Should get null to a invalid organization', async () => {
    // Arrange
    const orgData: IOrganizationContract.GetParams = {
      id: 'owner_id',
    };

    jest.spyOn(orgrepo, 'get').mockResolvedValue(null);

    // Act
    const org = await orgService.get(orgData);

    // Assert
    expect(orgrepo.get).toHaveBeenCalledTimes(1);
    expect(orgrepo.get).toHaveBeenCalledWith(orgData);
    expect(org).toBeNull();
  });

  it('Should getAll valid organizations', async () => {
    // Arrange
    const orgData: IOrganizationContract.GetAllParams = {
      owner_id: 'owner_id',
    };

    jest.spyOn(orgrepo, 'getAll').mockResolvedValue(
      Array.from({ length: 3 }).map((_, idx) => ({
        cep: faker.location.zipCode(),
        city: faker.location.city(),
        close_hour: 23,
        id: `org_id-${idx}`,
        name: `Org ${idx}`,
        description: faker.person.bio(),
        email: faker.internet.email(),
        image_url: faker.image.url(),
        lat: faker.location.latitude(),
        long: faker.location.longitude(),
        open_hour: 8,
        location_code: faker.location.buildingNumber(),
        neighborhood: faker.location.street(),
        street: faker.location.street(),
        owner_id: 'owner_id',
      })),
    );

    // Act
    const org = await orgService.getAll(orgData);

    // Assert
    expect(orgrepo.getAll).toHaveBeenCalledTimes(1);
    expect(orgrepo.getAll).toHaveBeenCalledWith(orgData);
    expect(org?.length).toBe(3);
    expect(org?.[0]).toBeInstanceOf(Organization);
  });

  it('Should get null to return all organizations', async () => {
    // Arrange
    const orgData: IOrganizationContract.GetAllParams = {
      owner_id: 'owner_id',
    };

    jest.spyOn(orgrepo, 'getAll').mockResolvedValue(null);

    // Act
    const org = await orgService.getAll(orgData);

    // Assert
    expect(orgrepo.getAll).toHaveBeenCalledTimes(1);
    expect(orgrepo.getAll).toHaveBeenCalledWith(orgData);
    expect(org).toBeNull();
  });

  it('Should return true if the user has a org searching by id', async () => {
    // Arrange
    const orgData: IOrganizationContract.VerifyOrgsParamsById = {
      owner_id: 'owner_id',
      org_id: 'Org',
    };

    jest.spyOn(orgrepo, 'verifyOrgById').mockResolvedValue({
      cep: faker.location.zipCode(),
      city: faker.location.city(),
      close_hour: 23,
      id: ulid(),
      name: faker.company.name(),
      description: faker.person.bio(),
      email: faker.internet.email(),
      image_url: faker.image.url(),
      lat: faker.location.latitude(),
      long: faker.location.longitude(),
      open_hour: 8,
      location_code: faker.location.buildingNumber(),
      neighborhood: faker.location.street(),
      street: faker.location.street(),
      owner_id: 'owner_id',
    });

    // Act
    const org = await orgService.verifyOrgById(orgData);

    // Assert
    expect(orgrepo.verifyOrgById).toHaveBeenCalledTimes(1);
    expect(orgrepo.verifyOrgById).toHaveBeenCalledWith(orgData);
    expect(org).toBeTruthy();
  });

  it('Should return false if the user has not a org searching by id', async () => {
    // Arrange
    const orgData: IOrganizationContract.VerifyOrgsParamsById = {
      owner_id: 'owner_id',
      org_id: 'Org',
    };

    jest.spyOn(orgrepo, 'verifyOrgById').mockResolvedValue(null);

    // Act
    const org = await orgService.verifyOrgById(orgData);

    // Assert
    expect(orgrepo.verifyOrgById).toHaveBeenCalledTimes(1);
    expect(orgrepo.verifyOrgById).toHaveBeenCalledWith(orgData);
    expect(org).toBeFalsy();
  });

  it('Should return true if the user has a org searching by the name', async () => {
    // Arrange
    const orgData: IOrganizationContract.VerifyOrgsParamsByName = {
      owner_id: 'owner_id',
      name: faker.company.name(),
    };

    jest.spyOn(orgrepo, 'verifyOrgByName').mockResolvedValue({
      cep: faker.location.zipCode(),
      city: faker.location.city(),
      close_hour: 23,
      id: ulid(),
      name: faker.company.name(),
      description: faker.person.bio(),
      email: faker.internet.email(),
      image_url: faker.image.url(),
      lat: faker.location.latitude(),
      long: faker.location.longitude(),
      open_hour: 8,
      location_code: faker.location.buildingNumber(),
      neighborhood: faker.location.street(),
      street: faker.location.street(),
      owner_id: 'owner_id',
    });

    // Act
    const org = await orgService.verifyOrgByName(orgData);

    // Assert
    expect(orgrepo.verifyOrgByName).toHaveBeenCalledTimes(1);
    expect(orgrepo.verifyOrgByName).toHaveBeenCalledWith(orgData);
    expect(org).toBeTruthy();
  });

  it('Should return false if the user has not a org searching by the name', async () => {
    // Arrange
    const orgData: IOrganizationContract.VerifyOrgsParamsByName = {
      owner_id: 'owner_id',
      name: 'Org',
    };

    jest.spyOn(orgrepo, 'verifyOrgByName').mockResolvedValue(null);

    // Act
    const org = await orgService.verifyOrgByName(orgData);

    // Assert
    expect(orgrepo.verifyOrgByName).toHaveBeenCalledTimes(1);
    expect(orgrepo.verifyOrgByName).toHaveBeenCalledWith(orgData);
    expect(org).toBeFalsy();
  });

  it('Should return informations about the CEP', async () => {
    // Arrange
    const cep = faker.location.zipCode();

    jest.spyOn(utilsService, 'getCepAddressInformations').mockResolvedValue({
      cep: cep,
      logradouro: faker.location.street(),
      complemento: '',
      unidade: '',
      bairro: faker.location.streetAddress(),
      localidade: 'São Paulo',
      uf: 'SP',
      estado: 'São Paulo',
      regiao: 'Sudeste',
      ibge: '3550308',
      gia: '1004',
      ddd: '11',
      siafi: '7107',
    });

    // Act
    const result = await orgService.getAddressInformation(cep);

    // Assert
    expect(utilsService.getCepAddressInformations).toHaveBeenCalledTimes(1);
    expect(utilsService.getCepAddressInformations).toHaveBeenCalledWith(cep);
    expect(result).toHaveProperty('cep', cep);
    expect(result).toHaveProperty('localidade', 'São Paulo');
    expect(result).toHaveProperty('uf', 'SP');
  });

  it('Should return null if the CEP is invalid', async () => {
    // Arrange
    const cep = faker.location.zipCode();

    jest
      .spyOn(utilsService, 'getCepAddressInformations')
      .mockResolvedValue(null);

    // Act
    const result = await orgService.getAddressInformation(cep);

    // Assert
    expect(utilsService.getCepAddressInformations).toHaveBeenCalledTimes(1);
    expect(utilsService.getCepAddressInformations).toHaveBeenCalledWith(cep);
    expect(result).toBeNull();
  });

  it('Should return error if occur some error on the CEP service', async () => {
    // Arrange
    const cep = faker.location.zipCode();

    jest
      .spyOn(utilsService, 'getCepAddressInformations')
      .mockResolvedValue({ erro: 'true' });

    // Act
    const result = await orgService.getAddressInformation(cep);

    // Assert
    expect(utilsService.getCepAddressInformations).toHaveBeenCalledTimes(1);
    expect(utilsService.getCepAddressInformations).toHaveBeenCalledWith(cep);
    expect(result).toBeNull();
  });

  it('Should upload a file', async () => {
    // Arrange
    const filename = faker.system.fileName();
    const file = {
      originalname: filename,
      buffer: Buffer.from('file-content'),
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;

    jest
      .spyOn(storageService, 'uploadFile')
      .mockResolvedValue({ fileKey: 'organization/132adad/image.png' });

    // Act
    const result = await orgService.uploadFile({
      file,
      org,
    });

    // Assert
    expect(storageService.uploadFile).toHaveBeenCalledTimes(1);
    expect(result).toBeInstanceOf(Organization);
  });

  it('Should delete a file', async () => {
    // Arrange
    const filekey = 'organization/132adad/image.png';

    jest
      .spyOn(storageService, 'deleteFile')
      .mockResolvedValue({ success: true });

    // Act
    const result = await orgService.deleteFile({
      key: filekey,
    });

    // Assert
    expect(storageService.deleteFile).toHaveBeenCalledTimes(1);
    expect(storageService.deleteFile).toHaveBeenCalledWith({
      key: filekey,
    });
    expect(result).toBeTruthy();
  });

  it('Should delete a file if the file key is empty', async () => {
    // Arrange
    const filekey = '';

    jest
      .spyOn(storageService, 'deleteFile')
      .mockResolvedValue({ success: false });

    // Act
    const result = await orgService.deleteFile({
      key: filekey,
    });

    // Assert
    expect(storageService.deleteFile).toHaveBeenCalledTimes(1);
    expect(storageService.deleteFile).toHaveBeenCalledWith({
      key: filekey,
    });
    expect(result).toBeFalsy();
  });
});
