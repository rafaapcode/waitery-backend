import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { User, UserRole } from 'src/core/domain/entities/user';
import { HashService } from 'src/hash.service';
import { PrismaService } from 'src/infra/database/database.service';
import { IUSER_CONTRACT } from 'src/shared/constants';
import { UserRepo } from '../../repo/user.repository';
import { GetAllUserUseCase } from '../../usecases/GetAllUserUseCase';
import { UserService } from '../../user.service';

describe('GetAll Users UseCase', () => {
  let getAllUserUseCase: GetAllUserUseCase;
  let userService: IUserContract;
  let userRepo: UserRepo;
  let prismaService: PrismaService;
  let hashService: HashService;
  let user_id: string;
  let org_id: string;

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
    getAllUserUseCase = module.get<GetAllUserUseCase>(GetAllUserUseCase);
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

    await prismaService.user.createMany({
      data: Array.from({ length: 25 }).map((_, idx) => ({
        cpf: `${idx}`.repeat(11),
        name: `rafael ap ${idx}`,
        email: `rafaap${idx}@gmail.com`,
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: UserRole.ADMIN,
      })),
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

  afterAll(async () => {
    await prismaService.userOrg.deleteMany({
      where: {
        org_id: org_id,
      },
    });

    await prismaService.user.delete({
      where: {
        email: 'rafa.ap.ap.ap2003@gmail.com',
      },
    });

    const cpfs = Array.from({ length: 25 }).map((_, idx) =>
      `${idx}`.repeat(11),
    );

    await prismaService.user.deleteMany({
      where: {
        cpf: {
          in: cpfs,
        },
      },
    });
  }, 15000);

  it('Should all services be defined', () => {
    expect(getAllUserUseCase).toBeDefined();
    expect(userService).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(hashService).toBeDefined();
    expect(user_id).toBeDefined();
    expect(org_id).toBeDefined();
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
    expect(users.length).toBe(6);
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
        owner_id: 'user_id',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
