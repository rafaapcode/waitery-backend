import { Injectable } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Organization } from 'src/core/domain/entities/organization';
import { OrganizationRepo } from './repo/organization.repo';

@Injectable()
export class OrganizationService implements IOrganizationContract {
  constructor(private readonly orgRepo: OrganizationRepo) {}

  async create(
    params: IOrganizationContract.CreateParams,
  ): Promise<IOrganizationContract.CreateOutput> {
    const org = await this.orgRepo.create(params);

    return new Organization(org);
  }

  async update(
    params: IOrganizationContract.UpdateParams,
  ): Promise<IOrganizationContract.UpdateOutput> {
    const org = await this.orgRepo.update(params);

    return new Organization(org);
  }

  async delete(
    params: IOrganizationContract.DeleteParams,
  ): Promise<IOrganizationContract.DeleteOutput> {
    await this.orgRepo.delete(params);
  }

  async get(
    params: IOrganizationContract.GetParams,
  ): Promise<IOrganizationContract.GetOutput> {
    const org = await this.orgRepo.get(params);

    if (!org) return null;

    return new Organization(org);
  }

  async getAll(
    params: IOrganizationContract.GetAllParams,
  ): Promise<IOrganizationContract.GetAllOutput> {
    const orgs = await this.orgRepo.getAll(params);

    if (!orgs) return null;

    return orgs.map((org) => new Organization(org));
  }

  async verifyOrgById(
    params: IOrganizationContract.VerifyOrgsParamsById,
  ): Promise<IOrganizationContract.VerifyOrgsOutput> {
    const org = await this.orgRepo.verifyOrgById(params);
    if (!org) return false;
    return true;
  }

  async verifyOrgByName(
    params: IOrganizationContract.VerifyOrgsParamsByName,
  ): Promise<IOrganizationContract.VerifyOrgsOutput> {
    const org = await this.orgRepo.verifyOrgByName(params);
    if (!org) return false;
    return true;
  }
}
