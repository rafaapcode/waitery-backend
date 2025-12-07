import { Test, TestingModule } from '@nestjs/testing';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Organization } from 'src/core/domain/entities/organization';
import { IUTILS_SERVICE } from 'src/shared/constants';
import { OrganizationService } from '../../organization.service';
import { OrganizationRepo } from '../../repo/organization.repo';

describe('OrganizationService', () => {
  let orgService: OrganizationService;
  let orgrepo: OrganizationRepo;
  let utilsService: IUtilsContract;

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
          },
        },
      ],
    }).compile();

    orgService = module.get<OrganizationService>(OrganizationService);
    orgrepo = module.get<OrganizationRepo>(OrganizationRepo);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
  });

  it('All services must be defined', () => {
    expect(orgService).toBeDefined();
    expect(orgrepo).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should create an organization', async () => {
    // Arrange
    const orgData: IOrganizationContract.CreateParams = {
      data: {
        cep: '12345678',
        city: 'City',
        close_hour: 23,
        name: 'Org',
        description: 'Org description',
        email: 'rafa@gmail.com',
        image_url: 'http://image.com',
        lat: -23.55052,
        long: -46.633308,
        open_hour: 8,
        location_code: '1231313',
        neighborhood: 'Neighborhood',
        street: 'Street',
      },
      owner_id: 'owner_id',
    };

    jest.spyOn(orgrepo, 'create').mockResolvedValue({
      cep: '12345678',
      city: 'City',
      close_hour: 23,
      id: `org_id`,
      name: `Org `,
      description: 'Org description',
      email: 'rafa@gmail.com',
      image_url: 'http://image.com',
      lat: -23.55052,
      long: -46.633308,
      open_hour: 8,
      location_code: '1231313',
      neighborhood: 'Neighborhood',
      street: 'Street',
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
    const orgData: IOrganizationContract.UpdateParams = {
      data: {
        cep: '12345678',
        city: 'City',
        close_hour: 23,
        name: 'Org',
        description: 'Org description',
        email: 'rafa@gmail.com',
        image_url: 'http://image.com',
        lat: -23.55052,
        long: -46.633308,
        open_hour: 8,
        location_code: '1231313',
        neighborhood: 'Neighborhood',
        street: 'Street',
      },
      id: 'owner_id',
    };

    jest.spyOn(orgrepo, 'update').mockResolvedValue({
      cep: '12345678',
      city: 'City',
      close_hour: 23,
      id: `org_id`,
      name: `Org `,
      description: 'Org description',
      email: 'rafa@gmail.com',
      image_url: 'http://image.com',
      lat: -23.55052,
      long: -46.633308,
      open_hour: 8,
      location_code: '1231313',
      neighborhood: 'Neighborhood',
      street: 'Street',
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
      cep: '12345678',
      city: 'City',
      close_hour: 23,
      id: `org_id`,
      name: `Org `,
      description: 'Org description',
      email: 'rafa@gmail.com',
      image_url: 'http://image.com',
      lat: -23.55052,
      long: -46.633308,
      open_hour: 8,
      location_code: '1231313',
      neighborhood: 'Neighborhood',
      street: 'Street',
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
        cep: '12345678',
        city: 'City',
        close_hour: 23,
        id: `org_id-${idx}`,
        name: `Org ${idx}`,
        description: 'Org description',
        email: 'rafa@gmail.com',
        image_url: 'http://image.com',
        lat: -23.55052,
        long: -46.633308,
        open_hour: 8,
        location_code: '1231313',
        neighborhood: 'Neighborhood',
        street: 'Street',
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
      cep: '12345678',
      city: 'City',
      close_hour: 23,
      id: 'org_id',
      name: 'Org',
      description: 'Org description',
      email: 'rafa@gmail.com',
      image_url: 'http://image.com',
      lat: -23.55052,
      long: -46.633308,
      open_hour: 8,
      location_code: '1231313',
      neighborhood: 'Neighborhood',
      street: 'Street',
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
      name: 'Org',
    };

    jest.spyOn(orgrepo, 'verifyOrgByName').mockResolvedValue({
      cep: '12345678',
      city: 'City',
      close_hour: 23,
      id: 'org_id',
      name: 'Org',
      description: 'Org description',
      email: 'rafa@gmail.com',
      image_url: 'http://image.com',
      lat: -23.55052,
      long: -46.633308,
      open_hour: 8,
      location_code: '1231313',
      neighborhood: 'Neighborhood',
      street: 'Street',
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
});
