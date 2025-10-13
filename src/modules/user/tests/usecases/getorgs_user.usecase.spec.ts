import { Test, TestingModule } from '@nestjs/testing';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { Organization } from 'src/core/domain/entities/organization';
import { UserRole } from 'src/core/domain/entities/user';
import { HashService } from 'src/hash.service';
import { PrismaService } from 'src/infra/database/database.service';
import { IUSER_CONTRACT } from 'src/shared/constants';
import { UserRepo } from '../../repo/user.repository';
import { GetOrgsOfUserUseCase } from '../../usecases/GetOrgsOfUserUseCase';
import { UserService } from '../../user.service';

describe('Get Orgs Of Users UseCase', () => {
  let getOrgsOfUserUsecase: GetOrgsOfUserUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let hashService: HashService;
  let user_id: string;

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
          provide: HashService,
          useValue: {
            generateHash: jest.fn(),
            validateHash: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<IUserContract>(IUSER_CONTRACT);
    userRepo = module.get<UserRepo>(UserRepo);
    prismaService = module.get<PrismaService>(PrismaService);
    getOrgsOfUserUsecase =
      module.get<GetOrgsOfUserUseCase>(GetOrgsOfUserUseCase);
    hashService = module.get<HashService>(HashService);

    const user = await prismaService.user.create({
      data: {
        cpf: '45587667820',
        name: 'rafael ap',
        email: 'rafa.ap.ap.ap2003@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: UserRole.OWNER,
      },
    });

    await prismaService.organization.createMany({
      data: Array.from({ length: 4 }).map((_, idx) => ({
        name: `Restaurante Fogo de chão - ${idx}`,
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
      })),
    });

    user_id = user.id;
  });

  afterAll(async () => {
    await prismaService.organization.deleteMany({
      where: {
        owner_id: user_id,
      },
    });

    await prismaService.user.delete({
      where: {
        email: 'rafa.ap.ap.ap2003@gmail.com',
      },
    });
  }, 15000);

  it('Should all services be defined', () => {
    expect(getOrgsOfUserUsecase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(hashService).toBeDefined();
    expect(user_id).toBeDefined();
  });

  it('Should get all orgs fo a user', async () => {
    // Act
    const orgs = await getOrgsOfUserUsecase.execute(user_id);

    // Assert
    expect(orgs.length).toBe(4);
    expect(orgs[0]).toBeInstanceOf(Organization);
    expect(orgs[0].name).toBe('Restaurante Fogo de chão - 0');
    expect(orgs[1].name).toBe('Restaurante Fogo de chão - 1');
    expect(orgs[2].name).toBe('Restaurante Fogo de chão - 2');
  });

  it('Should return an empty array', async () => {
    // Act
    const orgs = await getOrgsOfUserUsecase.execute('user_id');

    // Assert
    expect(orgs.length).toBe(0);
    expect(orgs).toMatchObject([]);
  });
});
