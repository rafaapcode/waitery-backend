import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IORGANIZATION_CONTRACT } from 'src/shared/constants';

interface IDeleteOrganizationUseCase {
  execute(id: string, owner_id: string): Promise<void>;
}

@Injectable()
export class DeleteOrganizationUseCase implements IDeleteOrganizationUseCase {
  constructor(
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(id: string, owner_id: string): Promise<void> {
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

    this.orgService
      .deleteFile({
        key: this.getImageKeyFromUrl(org.image_url),
      })
      .catch((err) =>
        this.observabilityService.error(
          'DeleteOrganizationUseCase',
          `Error deleting organization image file ${JSON.stringify(err)}`,
          '',
        ),
      );

    await this.orgService.delete({ id });
  }

  private getImageKeyFromUrl(url: string): string {
    const urlObj = new URL(url);
    return urlObj.pathname.slice(1);
  }
}
