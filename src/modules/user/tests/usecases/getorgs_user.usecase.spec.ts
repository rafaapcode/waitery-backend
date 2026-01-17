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
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Organization } from 'src/core/domain/entities/organization';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import {
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { UserRepo } from '../../repo/user.repository';
import { GetOrgsOfUserUseCase } from '../../usecases/GetOrgsOfUserUseCase';
import { UserService } from '../../user.service';

describe('Get Orgs Of Users UseCase', () => {
  let getOrgsOfUserUsecase: GetOrgsOfUserUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let user_id: string;
  let storageService: IStorageGw;

  const userCpf = faker.string.numeric(11);
  const userName = faker.person.fullName();
  const userEmail = faker.internet.email();
  const hashPassword =
    '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u';
  const orgNames = Array.from({ length: 4 }).map(() => faker.company.name());
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
        GetOrgsOfUserUseCase,
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
    getOrgsOfUserUsecase =
      module.get<GetOrgsOfUserUseCase>(GetOrgsOfUserUseCase);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);

    const user = await prismaService.user.create({
      data: {
        cpf: userCpf,
        name: userName,
        email: userEmail,
        password: hashPassword,
        role: UserRole.OWNER,
      },
    });

    await prismaService.organization.createMany({
      data: Array.from({ length: 4 }).map((_, idx) => ({
        name: orgNames[idx],
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
      })),
    });

    user_id = user.id;
  });

  afterAll(async () => {
    await prismaService.organization.deleteMany({});

    await prismaService.user.deleteMany({});
  }, 15000);

  it('Should all services be defined', () => {
    expect(getOrgsOfUserUsecase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(user_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should get all orgs fo a user', async () => {
    // Act
    const orgs = await getOrgsOfUserUsecase.execute(user_id);

    // Assert
    expect(orgs.length).toBe(4);
    expect(orgs[0]).toBeInstanceOf(Organization);
    expect(orgs[0].name).toBe(orgNames[0]);
    expect(orgs[1].name).toBe(orgNames[1]);
    expect(orgs[2].name).toBe(orgNames[2]);
  });

  it('Should return an empty array', async () => {
    // Act
    const orgs = await getOrgsOfUserUsecase.execute(fakeUserId);

    // Assert
    expect(orgs.length).toBe(0);
    expect(orgs).toMatchObject([]);
  });
});
