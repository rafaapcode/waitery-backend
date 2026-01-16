import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as sentry from '@sentry/nestjs';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Organization } from 'src/core/domain/entities/organization';
import { IORGANIZATION_CONTRACT } from 'src/shared/constants';
import { UpdateOrganizationDTO } from '../dto/update-organization.dto';

export type UpdateOrganizationParams = {
  id: string;
  owner_id: string;
  data: UpdateOrganizationDTO;
  image_file?: Express.Multer.File;
};

interface IUpdateOrganizationUseCase {
  execute(params: UpdateOrganizationParams): Promise<Organization>;
}

@Injectable()
export class UpdateOrganizationUseCase implements IUpdateOrganizationUseCase {
  constructor(
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
  ) {}

  async execute(params: UpdateOrganizationParams): Promise<Organization> {
    const { id, owner_id, data, image_file } = params;

    const user_has_org = await this.orgService.verifyOrgById({
      org_id: id,
      owner_id,
    });

    if (!user_has_org) {
      throw new NotFoundException('Organization Not Found');
    }

    const org = await this.orgService.get({ id });

    if (!org) {
      throw new NotFoundException('Organization Not Found');
    }

    if (image_file) {
      if (org.image_url) {
        this.orgService
          .deleteFile({
            key: this.getImageKeyFromUrl(org.image_url),
          })
          .catch((err) =>
            sentry.logger.error(
              `Error deleting organization image file ${JSON.stringify(err)}`,
            ),
          );
      }

      await this.orgService.uploadFile({
        file: image_file,
        org,
      });
    }

    const org_updated = await this.orgService.update({
      id,
      data: { ...data, image_url: org.image_url },
    });

    return org_updated;
  }

  private getImageKeyFromUrl(url: string): string {
    const urlObj = new URL(url);
    return urlObj.pathname.slice(1);
  }
}
