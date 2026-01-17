import { faker } from '@faker-js/faker';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Category } from 'src/core/domain/entities/category';
import { PrismaService } from 'src/infra/database/database.service';
import { ICATEGORY_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';
import { GetByIdCategoryUseCase } from '../../usecases/GetByIdCategoryUseCase';

describe('Get Category by Id UseCase', () => {
  let getByIdCategoryUseCase: GetByIdCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;

  const ownerId = faker.string.uuid();
  const orgName = faker.company.name();
  const orgEmail = faker.internet.email();
  const orgDescription = faker.lorem.paragraph();
  const cityName = faker.location.city();
  const locationCode =
    faker.location.countryCode('alpha-2') +
    '-' +
    faker.location.state({ abbreviated: true }) +
    '-' +
    faker.string.numeric(3);
  const openHour = faker.number.int({ min: 6, max: 10 });
  const closeHour = faker.number.int({ min: 18, max: 23 });
  const categoryIcon = faker.internet.emoji();
  const categoryName = faker.commerce.department();
  const nonExistentCatId = faker.string.uuid();
  const wrongOrgId = faker.string.uuid();

  const owner_id = ownerId;
  let org_id: string;
  let cat_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetByIdCategoryUseCase,
        PrismaService,
        CategoryRepository,
        {
          provide: ICATEGORY_CONTRACT,
          useClass: CategoryService,
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

    getByIdCategoryUseCase = module.get<GetByIdCategoryUseCase>(
      GetByIdCategoryUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    categoryService = module.get<ICategoryContract>(ICATEGORY_CONTRACT);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);

    const { id } = await prismaService.organization.create({
      data: {
        name: orgName,
        image_url: faker.image.url(),
        email: orgEmail,
        description: orgDescription,
        location_code: locationCode,
        open_hour: openHour,
        close_hour: closeHour,
        cep: faker.location.zipCode(),
        city: cityName,
        neighborhood: faker.location.street(),
        street: faker.location.streetAddress(),
        lat: faker.location.latitude(),
        long: faker.location.longitude(),
        owner_id,
      },
    });

    const { id: cat_id_db } = await prismaService.category.create({
      data: {
        icon: categoryIcon,
        name: categoryName,
        org_id: id,
      },
    });

    org_id = id;
    cat_id = cat_id_db;
  });

  afterAll(async () => {
    await prismaService.category.delete({
      where: {
        id: cat_id,
      },
    });
    await prismaService.organization.delete({
      where: {
        id: org_id,
      },
    });
  });

  it('Should all services be defined', () => {
    expect(getByIdCategoryUseCase).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should get the category by id', async () => {
    // Act
    const cat = await getByIdCategoryUseCase.execute(cat_id, org_id);

    // Assert
    expect(cat).toBeInstanceOf(Category);
    expect(cat.id).toBeDefined();
    expect(cat.org_id).toBeDefined();
  });

  it('Should throw an NotFoundException if the category does not exists', async () => {
    // Assert
    await expect(
      getByIdCategoryUseCase.execute(nonExistentCatId, org_id),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an ConflicException if the org does not match', async () => {
    // Assert
    await expect(
      getByIdCategoryUseCase.execute(cat_id, wrongOrgId),
    ).rejects.toThrow(ConflictException);
  });
});
