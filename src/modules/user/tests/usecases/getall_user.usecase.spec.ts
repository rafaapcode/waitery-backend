import { faker } from '@faker-js/faker';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { User, UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import {
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { UserRepo } from '../../repo/user.repository';
import { GetAllUserUseCase } from '../../usecases/GetAllUserUseCase';
import { UserService } from '../../user.service';

describe('GetAll Users UseCase', () => {
  let getAllUserUseCase: GetAllUserUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let user_id: string;
  let org_id: string;
  let storageService: IStorageGw;

  const ownerCpf = faker.string.numeric(11);
  const ownerName = faker.person.fullName();
  const ownerEmail = faker.internet.email();
  const hashPassword =
    '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u';
  const orgName = faker.company.name();
  const orgImageUrl = faker.internet.url();
  const orgEmail = faker.internet.email();
  const orgDescription = faker.lorem.sentence();
  const orgLocationCode = `BR-${faker.location.state({ abbreviated: true })}-${faker.string.numeric(3)}`;
  const orgOpenHour = faker.number.int({ min: 6, max: 10 });
  const orgCloseHour = faker.number.int({ min: 18, max: 22 });
  const orgCep = faker.string.numeric(8);
  const orgCity = faker.location.city();
  const orgNeighborhood = faker.location.street();
  const orgStreet = faker.location.streetAddress();
  const orgLat = faker.location.latitude();
  const orgLong = faker.location.longitude();
  const fakeUserId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepo,
        PrismaService,
        GetAllUserUseCase,
        {
          provide: IUSER_CONTRACT,
          useClass: UserService,
        },
        {
          provide: IUTILS_SERVICE,
          useValue: {
            generateHash: jest.fn(),
            validateHash: jest.fn(),
          },
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
    prismaService = module.get<PrismaService>(PrismaService);
    getAllUserUseCase = module.get<GetAllUserUseCase>(GetAllUserUseCase);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);

    const user = await prismaService.user.create({
      data: {
        cpf: ownerCpf,
        name: ownerName,
        email: ownerEmail,
        password: hashPassword,
        role: UserRole.OWNER,
      },
    });

    await prismaService.user.createMany({
      data: Array.from({ length: 25 }).map(() => ({
        cpf: faker.string.numeric(11),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashPassword,
        role: UserRole.ADMIN,
      })),
    });

    const { id } = await prismaService.organization.create({
      data: {
        name: orgName,
        image_url: orgImageUrl,
        email: orgEmail,
        description: orgDescription,
        location_code: orgLocationCode,
        open_hour: orgOpenHour,
        close_hour: orgCloseHour,
        cep: orgCep,
        city: orgCity,
        neighborhood: orgNeighborhood,
        street: orgStreet,
        lat: orgLat,
        long: orgLong,
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

  afterAll(async () => {
    await prismaService.userOrg.deleteMany({});
    await prismaService.user.deleteMany({});
    await prismaService.user.deleteMany({});
  }, 15000);

  it('Should all services be defined', () => {
    expect(getAllUserUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(user_id).toBeDefined();
    expect(org_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should return the first 10 users in the page 0', async () => {
    // Act
    const { has_next, users } = await getAllUserUseCase.execute({
      org_id,
      page: 0,
      owner_id: user_id,
    });

    //Assert
    expect(has_next).toBeTruthy();
    expect(users.length).toBe(10);
    expect(users[0]).toBeInstanceOf(User);
  });

  it('Should return the 10 users differents in the page 1', async () => {
    // Act
    const usersFirstPage = await getAllUserUseCase.execute({
      org_id,
      page: 0,
      owner_id: user_id,
    });
    const { has_next, users } = await getAllUserUseCase.execute({
      org_id,
      page: 1,
      owner_id: user_id,
    });

    //Assert
    expect(has_next).toBeTruthy();
    expect(users.length).toBe(10);
    expect(users[0]).toBeInstanceOf(User);
    expect(users[0].id).not.toEqual(usersFirstPage.users[0].id);
    expect(users[0].name).not.toEqual(usersFirstPage.users[0].name);
  });

  it('Should return the last 5 users differents in the page 2', async () => {
    // Act
    const usersSecondPage = await getAllUserUseCase.execute({
      org_id,
      page: 1,
      owner_id: user_id,
    });
    const { has_next, users } = await getAllUserUseCase.execute({
      org_id,
      page: 2,
      owner_id: user_id,
    });

    //Assert
    expect(has_next).toBeFalsy();
    expect(users.length).toBeGreaterThan(5);
    expect(users.length).toBeLessThan(10);
    expect(users[0]).toBeInstanceOf(User);
    expect(users[0].id).not.toEqual(usersSecondPage.users[0].id);
    expect(users[0].name).not.toEqual(usersSecondPage.users[0].name);
  });

  it('Should return 0 users in the page 3', async () => {
    // Act
    const { has_next, users } = await getAllUserUseCase.execute({
      org_id,
      page: 3,
      owner_id: user_id,
    });

    //Assert
    expect(has_next).toBeFalsy();
    expect(users.length).toBe(0);
    expect(users).toMatchObject([]);
  });

  it('Should throw an error if the user has not association with the organization', async () => {
    // Assert
    await expect(
      getAllUserUseCase.execute({
        org_id,
        page: 3,
        owner_id: fakeUserId,
      }),
    ).rejects.toThrow(ConflictException);
  });
});
