import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Organization } from 'src/core/domain/entities/organization';
import { User, UserRole } from 'src/core/domain/entities/user';
import { IUTILS_SERVICE } from 'src/shared/constants';
import { UserRepo } from '../../repo/user.repository';
import { UserService } from '../../user.service';

describe('UserService', () => {
  let userService: UserService;
  let utilsService: IUtilsContract;
  let userRepo: UserRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepo,
          useValue: {
            create: jest.fn(),
            createRelationWithOrg: jest.fn(),
            update: jest.fn(),
            updateMe: jest.fn(),
            delete: jest.fn(),
            getAll: jest.fn(),
            getMe: jest.fn(),
            get: jest.fn(),
            getuserByEmail: jest.fn(),
            getuserByCpf: jest.fn(),
            getUserOrgs: jest.fn(),
            verifyOrgById: jest.fn(),
          },
        },
        {
          provide: IUTILS_SERVICE,
          useValue: {
            generateHash: jest.fn(),
          },
        },
      ],
    }).compile();
    userService = module.get<UserService>(UserService);
    userRepo = module.get<UserRepo>(UserRepo);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
  });

  it('All services must be defined', () => {
    expect(userService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(userRepo).toBeDefined();
  });

  it('Should create a new user', async () => {
    // Arrange
    const data: IUserContract.CreateParams = {
      data: {
        cpf: '12345678900',
        email: 'rafa@gmail.com',
        name: 'Rafael',
        password: 'qweasdz',
        role: UserRole.OWNER,
      },
      org_id: 'org_id',
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_bcrypt');
    jest.spyOn(userRepo, 'create').mockResolvedValue({
      name: 'Rafael',
      id: '12313131adada',
      email: 'rafa@gmail.com',
      cpf: '12345678900',
      password: 'hash_bcrypt',
      role: UserRole.OWNER,
      created_at: new Date(),
      updated_at: new Date(),
    });
    jest.spyOn(userRepo, 'createRelationWithOrg').mockImplementation();

    // Act
    const userCreated = await userService.create(data);

    // Assert
    expect(userCreated).toBeDefined();
    expect(userCreated.password).toBe('hash_bcrypt');
    expect(utilsService.generateHash).toHaveBeenCalledTimes(1);
    expect(utilsService.generateHash).toHaveBeenCalledWith(data.data.password);
    expect(userRepo.create).toHaveBeenCalledTimes(1);
    expect(userRepo.create).toHaveBeenCalledWith({
      ...data.data,
      org_id: data.org_id,
      password: 'hash_bcrypt',
    });
    expect(userRepo.createRelationWithOrg).toHaveBeenCalledTimes(1);
  });

  it('Should update a user without password', async () => {
    // Arrange
    const data: IUserContract.UpdateParams = {
      data: {
        cpf: '12345678900',
        email: 'rafa@gmail.com',
        name: 'Rafael Ap',
        role: UserRole.OWNER,
      },
      id: '12313131adada',
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_bcrypt');
    jest.spyOn(userRepo, 'update').mockResolvedValue({
      name: 'Rafael Ap',
      id: '12313131adada',
      email: 'rafa@gmail.com',
      cpf: '12345678900',
      password: 'hash_bcrypt',
      role: UserRole.OWNER,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Act
    const userUpdated = await userService.update(data);

    // Assert
    expect(userUpdated).toBeInstanceOf(User);
    expect(userUpdated.password).toBeUndefined();
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    expect(userRepo.update).toHaveBeenCalledTimes(1);
    expect(userRepo.update).toHaveBeenCalledWith({
      id: data.id,
      data: {
        ...data.data,
      },
    });
  });

  it('Should update a user with password', async () => {
    // Arrange
    const data: IUserContract.UpdateParams = {
      data: {
        cpf: '12345678900',
        email: 'rafa@gmail.com',
        name: 'Rafael Ap',
        password: 'new_password',
        role: UserRole.OWNER,
      },
      id: '12313131adada',
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_bcrypt');
    jest.spyOn(userRepo, 'update').mockResolvedValue({
      name: 'Rafael Ap',
      id: '12313131adada',
      email: 'rafa@gmail.com',
      cpf: '12345678900',
      password: 'hash_bcrypt',
      role: UserRole.OWNER,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Act
    const userUpdated = await userService.update(data);

    // Assert
    expect(userUpdated).toBeInstanceOf(User);
    expect(userUpdated.password).toBeUndefined();
    expect(utilsService.generateHash).toHaveBeenCalledTimes(1);
    expect(userRepo.update).toHaveBeenCalledTimes(1);
    expect(userRepo.update).toHaveBeenCalledWith({
      id: data.id,
      data: {
        ...data.data,
        password: 'hash_bcrypt',
      },
    });
  });

  it('Should updateMe a user without password', async () => {
    // Arrange
    const data: IUserContract.UpdateMeParams = {
      data: {
        email: 'rafa@gmail.com',
        name: 'Rafael Ap',
      },
      id: '12313131adada',
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_bcrypt');
    jest.spyOn(userRepo, 'updateMe').mockResolvedValue({
      name: 'Rafael Ap',
      id: '12313131adada',
      email: 'rafa@gmail.com',
      cpf: '12345678900',
      password: 'hash_bcrypt',
      role: UserRole.OWNER,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Act
    const userUpdated = await userService.updateMe(data);

    // Assert
    expect(userUpdated).toBeInstanceOf(User);
    expect(userUpdated.password).toBeUndefined();
    expect(utilsService.generateHash).toHaveBeenCalledTimes(0);
    expect(userRepo.updateMe).toHaveBeenCalledTimes(1);
    expect(userRepo.updateMe).toHaveBeenCalledWith({
      id: data.id,
      data: {
        ...data.data,
      },
    });
  });

  it('Should updateMe a user with password', async () => {
    // Arrange
    const data: IUserContract.UpdateMeParams = {
      data: {
        email: 'rafa@gmail.com',
        name: 'Rafael Ap',
        new_password: 'new_password',
      },
      id: '12313131adada',
    };
    jest.spyOn(utilsService, 'generateHash').mockResolvedValue('hash_bcrypt');
    jest.spyOn(userRepo, 'updateMe').mockResolvedValue({
      name: 'Rafael Ap',
      id: '12313131adada',
      email: 'rafa@gmail.com',
      cpf: '12345678900',
      password: 'hash_bcrypt',
      role: UserRole.OWNER,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Act
    const userUpdated = await userService.updateMe(data);

    // Assert
    expect(userUpdated).toBeInstanceOf(User);
    expect(userUpdated.password).toBeUndefined();
    expect(utilsService.generateHash).toHaveBeenCalledTimes(1);
    expect(userRepo.updateMe).toHaveBeenCalledTimes(1);
    expect(userRepo.updateMe).toHaveBeenCalledWith({
      id: data.id,
      data: {
        ...data.data,
        new_password: 'hash_bcrypt',
      },
    });
  });

  it('Should delete a user', async () => {
    // Arrange
    const data: IUserContract.DeleteParams = {
      id: '12313131adada',
    };
    jest.spyOn(userRepo, 'delete').mockResolvedValue(true);

    // Act
    await userService.delete(data);

    // Assert
    expect(userRepo.delete).toHaveBeenCalledTimes(1);
    expect(userRepo.delete).toHaveBeenCalledWith({ id: data.id });
  });

  it('Should getAll users with page 0 and has_next page', async () => {
    // Arrange
    const data: IUserContract.GetAllParams = {
      org_id: 'org_id',
      page: 0,
      owner_id: 'owner_id',
    };
    jest.spyOn(userRepo, 'verifyOrgById').mockResolvedValue(true);
    jest.spyOn(userRepo, 'getAll').mockResolvedValue(
      Array.from({ length: 11 }).map((_, idx) => ({
        cpf: `${idx}2345678900${idx}`,
        email: `rafa${idx}@gmail.com`,
        created_at: new Date(),
        id: `user_id${idx}`,
        name: 'Rafael Ap',
        password: 'hash_bcrypt',
        role: UserRole.OWNER,
        updated_at: new Date(),
      })),
    );

    // Act
    const allUsers = await userService.getAll(data);

    // Assert
    expect(userRepo.getAll).toHaveBeenCalledTimes(1);
    expect(userRepo.getAll).toHaveBeenCalledWith(data.org_id, 0, 11);
    expect(allUsers.has_next).toBeTruthy();
    expect(allUsers.users.length).toBe(10);
    expect(allUsers.users[0]).toBeInstanceOf(User);
  });

  it('Should getAll users with page 1 and has_next page', async () => {
    // Arrange
    const data: IUserContract.GetAllParams = {
      org_id: 'org_id',
      page: 1,
      owner_id: 'owner_id',
    };
    jest.spyOn(userRepo, 'verifyOrgById').mockResolvedValue(true);
    jest.spyOn(userRepo, 'getAll').mockResolvedValue(
      Array.from({ length: 11 }).map((_, idx) => ({
        cpf: `${idx}2345678900${idx}`,
        email: `rafa${idx}@gmail.com`,
        created_at: new Date(),
        id: `user_id${idx}`,
        name: 'Rafael Ap',
        password: 'hash_bcrypt',
        role: UserRole.OWNER,
        updated_at: new Date(),
      })),
    );

    // Act
    const allUsers = await userService.getAll(data);

    // Assert
    expect(userRepo.getAll).toHaveBeenCalledTimes(1);
    expect(userRepo.getAll).toHaveBeenCalledWith(data.org_id, 10, 11);
    expect(allUsers.has_next).toBeTruthy();
    expect(allUsers.users.length).toBe(10);
    expect(allUsers.users[0]).toBeInstanceOf(User);
  });

  it('Should getAll users with page 2 and has_next page', async () => {
    // Arrange
    const data: IUserContract.GetAllParams = {
      org_id: 'org_id',
      page: 2,
      owner_id: 'owner_id',
    };
    jest.spyOn(userRepo, 'verifyOrgById').mockResolvedValue(true);
    jest.spyOn(userRepo, 'getAll').mockResolvedValue(
      Array.from({ length: 11 }).map((_, idx) => ({
        cpf: `${idx}2345678900${idx}`,
        email: `rafa${idx}@gmail.com`,
        created_at: new Date(),
        id: `user_id${idx}`,
        name: 'Rafael Ap',
        password: 'hash_bcrypt',
        role: UserRole.OWNER,
        updated_at: new Date(),
      })),
    );

    // Act
    const allUsers = await userService.getAll(data);

    // Assert
    expect(userRepo.getAll).toHaveBeenCalledTimes(1);
    expect(userRepo.getAll).toHaveBeenCalledWith(data.org_id, 20, 11);
    expect(allUsers.has_next).toBeTruthy();
    expect(allUsers.users.length).toBe(10);
    expect(allUsers.users[0]).toBeInstanceOf(User);
  });

  it('Should getAll users with page 3 and has_next page', async () => {
    // Arrange
    const data: IUserContract.GetAllParams = {
      org_id: 'org_id',
      page: 3,
      owner_id: 'owner_id',
    };
    jest.spyOn(userRepo, 'verifyOrgById').mockResolvedValue(true);
    jest.spyOn(userRepo, 'getAll').mockResolvedValue(
      Array.from({ length: 11 }).map((_, idx) => ({
        cpf: `${idx}2345678900${idx}`,
        email: `rafa${idx}@gmail.com`,
        created_at: new Date(),
        id: `user_id${idx}`,
        name: 'Rafael Ap',
        password: 'hash_bcrypt',
        role: UserRole.OWNER,
        updated_at: new Date(),
      })),
    );

    // Act
    const allUsers = await userService.getAll(data);

    // Assert
    expect(userRepo.getAll).toHaveBeenCalledTimes(1);
    expect(userRepo.getAll).toHaveBeenCalledWith(data.org_id, 30, 11);
    expect(allUsers.has_next).toBeTruthy();
    expect(allUsers.users.length).toBe(10);
    expect(allUsers.users[0]).toBeInstanceOf(User);
  });

  it('Should getAll users in page 0/1 and has_next must be false', async () => {
    // Arrange
    const data: IUserContract.GetAllParams = {
      org_id: 'org_id',
      page: 0,
      owner_id: 'owner_id',
    };
    jest.spyOn(userRepo, 'verifyOrgById').mockResolvedValue(true);
    jest.spyOn(userRepo, 'getAll').mockResolvedValue(
      Array.from({ length: 10 }).map((_, idx) => ({
        cpf: `${idx}2345678900${idx}`,
        email: `rafa${idx}@gmail.com`,
        created_at: new Date(),
        id: `user_id${idx}`,
        name: 'Rafael Ap',
        password: 'hash_bcrypt',
        role: UserRole.OWNER,
        updated_at: new Date(),
      })),
    );

    // Act
    const allUsers = await userService.getAll(data);

    // Assert
    expect(userRepo.getAll).toHaveBeenCalledTimes(1);
    expect(userRepo.getAll).toHaveBeenCalledWith(data.org_id, 0, 11);
    expect(allUsers.has_next).toBeFalsy();
    expect(allUsers.users.length).toBe(10);
    expect(allUsers.users[0]).toBeInstanceOf(User);
  });

  it('Should throw an error if the user has not the org', async () => {
    // Arrange
    const data: IUserContract.GetAllParams = {
      org_id: 'org_id',
      page: 0,
      owner_id: 'owner_id',
    };
    jest.spyOn(userRepo, 'verifyOrgById').mockResolvedValue(false);
    jest.spyOn(userRepo, 'getAll').mockResolvedValue(
      Array.from({ length: 10 }).map((_, idx) => ({
        cpf: `${idx}2345678900${idx}`,
        email: `rafa${idx}@gmail.com`,
        created_at: new Date(),
        id: `user_id${idx}`,
        name: 'Rafael Ap',
        password: 'hash_bcrypt',
        role: UserRole.OWNER,
        updated_at: new Date(),
      })),
    );
    // Assert
    await expect(userService.getAll(data)).rejects.toThrow(ConflictException);
  });

  it('Should get the current user', async () => {
    // Arrange
    const data: IUserContract.GetMeParams = {
      id: 'user_id',
    };
    jest.spyOn(userRepo, 'getMe').mockResolvedValue({
      cpf: '2345678900',
      email: 'rafa@gmail.com',
      created_at: new Date(),
      id: 'user_id',
      name: 'Rafael Ap',
      password: 'hash_bcrypt',
      role: UserRole.OWNER,
      updated_at: new Date(),
    });

    // Act
    const user = await userService.getMe(data);

    // Assert
    expect(userRepo.getMe).toHaveBeenCalledTimes(1);
    expect(userRepo.getMe).toHaveBeenCalledWith({ id: data.id });
    expect(user).toBeInstanceOf(User);
  });

  it('Should not get the current user if dont exist', async () => {
    // Arrange
    const data: IUserContract.GetMeParams = {
      id: 'user_id',
    };
    jest.spyOn(userRepo, 'getMe').mockResolvedValue(null);

    // Act
    const user = await userService.getMe(data);

    // Assert
    expect(userRepo.getMe).toHaveBeenCalledTimes(1);
    expect(userRepo.getMe).toHaveBeenCalledWith({ id: data.id });
    expect(user).toBeNull();
  });

  it('Should get a user', async () => {
    // Arrange
    const data: IUserContract.GetParams = {
      id: 'user_id',
    };
    jest.spyOn(userRepo, 'get').mockResolvedValue({
      cpf: '2345678900',
      email: 'rafa@gmail.com',
      created_at: new Date(),
      id: 'user_id',
      name: 'Rafael Ap',
      password: 'hash_bcrypt',
      role: UserRole.OWNER,
      updated_at: new Date(),
    });

    // Act
    const user = await userService.get(data);

    // Assert
    expect(userRepo.get).toHaveBeenCalledTimes(1);
    expect(userRepo.get).toHaveBeenCalledWith({ id: data.id });
    expect(user).toBeInstanceOf(User);
  });

  it('Should not get a user if dont exist', async () => {
    // Arrange
    const data: IUserContract.GetParams = {
      id: 'user_id',
    };
    jest.spyOn(userRepo, 'get').mockResolvedValue(null);

    // Act
    const user = await userService.get(data);

    // Assert
    expect(userRepo.get).toHaveBeenCalledTimes(1);
    expect(userRepo.get).toHaveBeenCalledWith({ id: data.id });
    expect(user).toBeNull();
  });

  it('Should get a user by email', async () => {
    // Arrange
    const data: IUserContract.GetUserByEmailParams = {
      email: 'rafa@gmail.com',
    };
    jest.spyOn(userRepo, 'getuserByEmail').mockResolvedValue({
      cpf: '2345678900',
      email: 'rafa@gmail.com',
      created_at: new Date(),
      id: 'user_id',
      name: 'Rafael Ap',
      password: 'hash_bcrypt',
      role: UserRole.OWNER,
      updated_at: new Date(),
    });

    // Act
    const user = await userService.getuserByEmail(data);

    // Assert
    expect(userRepo.getuserByEmail).toHaveBeenCalledTimes(1);
    expect(userRepo.getuserByEmail).toHaveBeenCalledWith({ email: data.email });
    expect(user).toBeInstanceOf(User);
  });

  it('Should not get a user by email if dont exist', async () => {
    // Arrange
    const data: IUserContract.GetUserByEmailParams = {
      email: 'rafa@gmail.com',
    };
    jest.spyOn(userRepo, 'getuserByEmail').mockResolvedValue(null);

    // Act
    const user = await userService.getuserByEmail(data);

    // Assert
    expect(userRepo.getuserByEmail).toHaveBeenCalledTimes(1);
    expect(userRepo.getuserByEmail).toHaveBeenCalledWith({ email: data.email });
    expect(user).toBeNull();
  });

  it('Should get a user by cpf', async () => {
    // Arrange
    const data: IUserContract.GetUserByCpfParams = {
      cpf: '2345678900',
    };
    jest.spyOn(userRepo, 'getuserByCpf').mockResolvedValue({
      cpf: '2345678900',
      email: 'rafa@gmail.com',
      created_at: new Date(),
      id: 'user_id',
      name: 'Rafael Ap',
      password: 'hash_bcrypt',
      role: UserRole.OWNER,
      updated_at: new Date(),
    });

    // Act
    const user = await userService.getuserByCpf(data);

    // Assert
    expect(userRepo.getuserByCpf).toHaveBeenCalledTimes(1);
    expect(userRepo.getuserByCpf).toHaveBeenCalledWith({ cpf: data.cpf });
    expect(user).toBeInstanceOf(User);
  });

  it('Should not get a user by cpf if dont exist', async () => {
    // Arrange
    const data: IUserContract.GetUserByCpfParams = {
      cpf: '2345678900',
    };
    jest.spyOn(userRepo, 'getuserByCpf').mockResolvedValue(null);

    // Act
    const user = await userService.getuserByCpf(data);

    // Assert
    expect(userRepo.getuserByCpf).toHaveBeenCalledTimes(1);
    expect(userRepo.getuserByCpf).toHaveBeenCalledWith({ cpf: data.cpf });
    expect(user).toBeNull();
  });

  it('Should get all orgs of a user', async () => {
    // Arrange
    const data: IUserContract.GetOrgsParams = {
      owner_id: 'owner_user_id',
    };
    jest.spyOn(userRepo, 'getUserOrgs').mockResolvedValue(
      Array.from({ length: 3 }).map((_, idx) => ({
        cep: '12345678',
        city: 'City',
        close_hour: 23,
        created_at: new Date(),
        id: `org_id${idx}`,
        name: `Org ${idx}`,
        description: 'Org description',
        email: 'rafa@gmail.com',
        image_url: 'http://image.com',
        lat: -23.55052,
        long: -46.633308,
        open_hour: 8,
        location_code: '1231313',
        neighborhood: 'Neighborhood',
        owner_id: data.owner_id,
        street: 'Street',
      })),
    );

    // Act
    const orgs = await userService.getOrgs(data);

    // Assert
    expect(userRepo.getUserOrgs).toHaveBeenCalledTimes(1);
    expect(userRepo.getUserOrgs).toHaveBeenCalledWith({
      owner_id: data.owner_id,
    });
    expect(orgs[0]).toBeInstanceOf(Organization);
  });

  it('Should return a empty array if no organization was found', async () => {
    // Arrange
    const data: IUserContract.GetOrgsParams = {
      owner_id: 'owner_user_id',
    };
    jest.spyOn(userRepo, 'getUserOrgs').mockResolvedValue([]);

    // Act
    const orgs = await userService.getOrgs(data);

    // Assert
    expect(userRepo.getUserOrgs).toHaveBeenCalledTimes(1);
    expect(userRepo.getUserOrgs).toHaveBeenCalledWith({
      owner_id: data.owner_id,
    });
    expect(orgs.length).toBe(0);
  });
});
