import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';

@Injectable()
export class FactoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async generateManyCategories(
    quantidade = 10,
    orgId?: string,
    baseName?: string,
  ) {
    let org_id = orgId;
    if (!org_id) {
      const { organization } = await this.generateOrganizationWithOwner();
      org_id = organization.id;
    }
    const categoryIcon = faker.internet.emoji();
    const baseCategoryName = baseName || faker.commerce.department();
    const data = Array.from({ length: quantidade }).map((_, idx) => ({
      icon: categoryIcon,
      name: `${baseCategoryName} ${idx}`,
      org_id,
    }));
    await this.prismaService.category.createMany({ data });
    // Busca as categorias criadas para retornar
    const categorias = await this.prismaService.category.findMany({
      where: { org_id },
      orderBy: { name: 'asc' },
      take: quantidade,
    });
    return categorias;
  }
  async generateProductInfo(
    orgId?: string,
    categoryId?: string,
    ingredientes?: string[],
  ) {
    let org_id = orgId;
    let category_id = categoryId;
    let ingredientsArr = ingredientes;

    // Cria organização se não enviada
    if (!org_id) {
      const { organization } = await this.generateOrganizationWithOwner();
      org_id = organization.id;
    }

    // Cria categoria se não enviada
    if (!category_id) {
      const category = await this.generateCategoryInfo(org_id);
      category_id = category.id;
    }

    // Cria ingredientes se não enviados
    if (!ingredientsArr || ingredientsArr.length === 0) {
      ingredientsArr = [
        faker.commerce.productMaterial(),
        faker.commerce.productMaterial(),
      ];
    }

    const productName = faker.commerce.productName();
    const productDescription = faker.commerce.productDescription();
    const productPrice = faker.number.int({ min: 10, max: 500 });

    const product = await this.prismaService.product.create({
      data: {
        name: productName,
        description: productDescription,
        image_url: faker.image.url(),
        ingredients: ingredientsArr,
        price: productPrice,
        category_id,
        org_id,
      },
    });

    return product;
  }

  async generateUserInfo(role: UserRole = UserRole.OWNER) {
    const userName = faker.person.fullName();
    const userEmail = faker.internet.email();
    const userCpf = faker.string.numeric(11);
    const hashBcrypt =
      '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u'; // qweasdzxc2003

    const user = await this.prismaService.user.create({
      data: {
        name: userName,
        email: userEmail,
        cpf: userCpf,
        password: hashBcrypt,
        role,
      },
    });

    return user;
  }

  async generateCategoryInfo(org_id?: string) {
    const categoryIcon = faker.internet.emoji();
    const categoryName = faker.commerce.department();
    const orgId = faker.string.uuid();

    const category = await this.prismaService.category.create({
      data: {
        org_id: org_id || orgId,
        name: categoryName,
        icon: categoryIcon,
      },
    });

    return category;
  }

  async generateOrganizationWithOwner(owner_id?: string) {
    let owner_id_local = owner_id;
    if (!owner_id_local) {
      // Cria o owner
      const owner = await this.generateUserInfo();
      owner_id_local = owner.id;
    }

    // Dados da organização
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

    const organization = await this.prismaService.organization.create({
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
        owner_id: owner_id_local,
      },
    });

    return { owner: { id: owner_id_local }, organization };
  }
}
