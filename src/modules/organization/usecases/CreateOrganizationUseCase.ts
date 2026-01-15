import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as sentry from '@sentry/nestjs';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { createOganizationEntity } from 'src/core/domain/entities/organization';
import {
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
} from 'src/shared/constants';
import { CreateOrganizationDTO } from '../dto/create-organization.dto';

type CreateParams = {
  owner_id: string;
  data: CreateOrganizationDTO;
  image_file?: Express.Multer.File;
};

interface ICreateOrganizationUseCase {
  execute(params: CreateParams): Promise<IOrganizationContract.CreateOutput>;
}

@Injectable()
export class CreateOrganizationUseCase implements ICreateOrganizationUseCase {
  constructor(
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
    @Inject(IUSER_CONTRACT)
    private readonly userService: IUserContract,
    @Inject(ISTORAGE_SERVICE)
    private readonly storageService: IStorageGw,
  ) {}

  async execute({
    data,
    owner_id,
    image_file,
  }: CreateParams): Promise<IOrganizationContract.CreateOutput> {
    const getAddressInformation = await this.orgService.getAddressInformation(
      data.cep,
    );

    if (!getAddressInformation || 'erro' in getAddressInformation) {
      sentry.logger.warn(`Address information not found for CEP: ${data.cep}`);
    }

    const organization = createOganizationEntity({
      ...data,
      close_hour: Number(data.close_hour),
      open_hour: Number(data.open_hour),
      owner_id,
      city: getAddressInformation
        ? `${getAddressInformation.localidade}-${getAddressInformation.uf}`
        : '',
      neighborhood: getAddressInformation ? getAddressInformation.bairro : '',
      street: getAddressInformation ? getAddressInformation.logradouro : '',
      lat: 0,
      long: 0,
    });

    const [org, owner] = await Promise.all([
      this.orgService.verifyOrgByName({
        name: organization.name,
        owner_id: organization.owner_id,
      }),
      this.userService.get({ id: organization.owner_id }),
    ]);

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    if (org) {
      throw new ConflictException(
        `Organization with the name '${organization.name}' already exist`,
      );
    }

    if (image_file) {
      const input_key = this.storageService.getFileKey({
        filename: image_file.originalname,
        orgId: organization.id,
      });

      const { fileKey } = await this.storageService.uploadFile({
        fileBuffer: image_file.buffer,
        key: input_key,
        contentType: image_file.mimetype,
        size: image_file.size,
        orgId: organization.id,
      });

      if (!fileKey) {
        sentry.logger.error('Error uploading organization image file');
      } else {
        organization.setNewImageUrl(fileKey);
      }
    }

    await this.orgService.create({
      data: organization,
      owner_id: organization.owner_id,
    });

    return organization;
  }
}
