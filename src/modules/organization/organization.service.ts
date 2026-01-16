import { Inject, Injectable } from '@nestjs/common';
import * as sentry from '@sentry/nestjs';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Organization } from 'src/core/domain/entities/organization';
import { ISTORAGE_SERVICE, IUTILS_SERVICE } from 'src/shared/constants';
import { OrganizationRepo } from './repo/organization.repo';

@Injectable()
export class OrganizationService implements IOrganizationContract {
  constructor(
    private readonly orgRepo: OrganizationRepo,
    @Inject(IUTILS_SERVICE)
    private readonly utilsService: IUtilsContract,
    @Inject(ISTORAGE_SERVICE)
    private readonly storageService: IStorageGw,
  ) {}

  async deleteFile(
    params: IOrganizationContract.DeleteFileParams,
  ): Promise<IOrganizationContract.DeleteFileOutput> {
    const { success } = await this.storageService.deleteFile(params);
    return success;
  }

  async uploadFile(
    params: IOrganizationContract.UploadFileParams,
  ): Promise<IOrganizationContract.UploadFileOutput> {
    const { file, org } = params;
    const input_key = this.storageService.getFileKey({
      filename: file.originalname,
      orgId: org.id,
    });

    const { fileKey } = await this.storageService.uploadFile({
      fileBuffer: file.buffer,
      key: input_key,
      contentType: file.mimetype,
      size: file.size,
      orgId: org.id,
    });

    if (!fileKey) {
      sentry.logger.error('Error uploading organization image file');
    } else {
      org.setNewImageUrl(fileKey);
    }

    return org;
  }

  async getAddressInformation(
    cep: string,
  ): Promise<IOrganizationContract.GetAddressInformationOutput | null> {
    const address = await this.utilsService.getCepAddressInformations(cep);
    if (!address) return null;

    return 'erro' in address ? null : address;
  }

  verifyCep(
    params: IOrganizationContract.VerifyCepParams,
  ): Promise<IOrganizationContract.VerifyCepOutput> {
    return this.utilsService.verifyCepService(params);
  }

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
