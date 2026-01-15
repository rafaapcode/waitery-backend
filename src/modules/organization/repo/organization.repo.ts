import { Injectable } from '@nestjs/common';
import { Organization } from 'generated/prisma';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { PrismaService } from 'src/infra/database/database.service';

@Injectable()
export class OrganizationRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create({
    data,
    owner_id,
  }: IOrganizationContract.CreateParams): Promise<Organization> {
    const org = await this.prisma.organization.create({
      data: {
        ...(data.id && { id: data.id }),
        cep: data.cep,
        city: data.city,
        close_hour: data.close_hour,
        open_hour: data.open_hour,
        description: data.description,
        email: data.email,
        image_url: data.image_url,
        lat: data.lat,
        location_code: data.location_code,
        long: data.long,
        name: data.name,
        neighborhood: data.neighborhood,
        owner_id,
        street: data.street,
      },
    });

    return org;
  }

  async delete({ id }: IOrganizationContract.DeleteParams): Promise<void> {
    await this.prisma.organization.delete({
      where: { id },
    });
  }

  async update({
    data,
    id,
  }: IOrganizationContract.UpdateParams): Promise<Organization> {
    const updated_org = await this.prisma.organization.update({
      where: { id },
      data: {
        ...(data.cep && { cep: data.cep }),
        ...(data.city && { city: data.city }),
        ...(data.close_hour && { close_hour: data.close_hour }),
        ...(data.open_hour && { open_hour: data.open_hour }),
        ...(data.description && { description: data.description }),
        ...(data.email && { email: data.email }),
        ...(data.image_url && { image_url: data.image_url }),
        ...(data.lat && { lat: data.lat }),
        ...(data.location_code && { location_code: data.location_code }),
        ...(data.long && { long: data.long }),
        ...(data.name && { name: data.name }),
        ...(data.neighborhood && { neighborhood: data.neighborhood }),
        ...(data.street && { street: data.street }),
      },
    });

    return updated_org;
  }

  async get({
    id,
  }: IOrganizationContract.GetParams): Promise<Organization | null> {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    return org;
  }

  async getAll({
    owner_id,
  }: IOrganizationContract.GetAllParams): Promise<Organization[] | null> {
    const org = await this.prisma.organization.findMany({
      where: { owner_id },
    });
    return org;
  }

  async verifyOrgById({
    org_id,
    owner_id,
  }: IOrganizationContract.VerifyOrgsParamsById): Promise<Organization | null> {
    const org = await this.prisma.organization.findFirst({
      where: {
        AND: [
          {
            owner_id,
          },
          {
            id: org_id,
          },
        ],
      },
    });
    return org;
  }

  async verifyOrgByName({
    name,
    owner_id,
  }: IOrganizationContract.VerifyOrgsParamsByName): Promise<Organization | null> {
    const org = await this.prisma.organization.findFirst({
      where: {
        AND: [
          {
            owner_id,
          },
          {
            name,
          },
        ],
      },
    });
    return org;
  }
}
