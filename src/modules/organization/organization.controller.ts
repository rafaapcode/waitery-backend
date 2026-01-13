import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { GetMe } from 'src/common/decorators/GetMe';
import { GetOrgId } from 'src/common/decorators/GetOrgId';
import { Roles } from 'src/common/decorators/Role';
import { UserRole } from 'src/core/domain/entities/user';
import { JwtPayload } from 'src/express';
import { CreateOrganizationDTO } from './dto/create-organization.dto';
import { UpdateOrganizationDTO } from './dto/update-organization.dto';
import { CreateOrganizationUseCase } from './usecases/CreateOrganizationUseCase';
import { DeleteOrganizationUseCase } from './usecases/DeleteOrganizationUseCase';
import { GetAllOrganizationUseCase } from './usecases/GetAllOrganizationUseCase';
import { GetOrganizationUseCase } from './usecases/GetOrganizationUseCase';
import { UpdateOrganizationUseCase } from './usecases/UpdateOrganizationUseCase';

@ApiTags('Organization')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly createOrgUseCase: CreateOrganizationUseCase,
    private readonly deleteOrgUseCase: DeleteOrganizationUseCase,
    private readonly getOrgUseCase: GetOrganizationUseCase,
    private readonly updateOrgUseCase: UpdateOrganizationUseCase,
    private readonly getAllOrgUseCase: GetAllOrganizationUseCase,
  ) {}

  @Roles(UserRole.OWNER)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @GetMe() me: JwtPayload,
    @Body() data: string,
  ) {
    const parsedData = plainToInstance(CreateOrganizationDTO, data);
    const org = await this.createOrgUseCase.execute({
      data: parsedData,
      owner_id: me.id,
      image_file: file,
    });

    return {
      org: org.fromEntity(),
    };
  }

  @Roles(UserRole.OWNER)
  @Get('all')
  @HttpCode(HttpStatus.OK)
  async getAll(@GetMe() me: JwtPayload) {
    const orgs = await this.getAllOrgUseCase.execute(me.id);
    return { orgs: orgs.map((org) => org.fromEntity()) };
  }

  // Params
  @Roles(UserRole.OWNER)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async delete(@GetOrgId() org_id: string, @GetMe() me: JwtPayload) {
    await this.deleteOrgUseCase.execute(org_id, me.id);
    return { message: 'Organization deleted with success' };
  }

  @Roles(UserRole.OWNER)
  @Get()
  @HttpCode(HttpStatus.OK)
  async get(@GetOrgId() org_id: string, @GetMe() me: JwtPayload) {
    const org = await this.getOrgUseCase.execute(org_id, me.id);
    return { org: org.fromEntity() };
  }

  @Roles(UserRole.OWNER)
  @Patch()
  @HttpCode(HttpStatus.OK)
  async update(
    @GetOrgId() org_id: string,
    @Body() data: UpdateOrganizationDTO,
    @GetMe() me: JwtPayload,
  ) {
    const org = await this.updateOrgUseCase.execute(org_id, me.id, data);
    return { org: org.fromEntity() };
  }
}
