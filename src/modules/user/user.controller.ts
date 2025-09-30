import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetMe } from 'src/common/decorators/GetMe';
import { Roles } from 'src/common/decorators/Role';
import { ParseULIDPipe } from 'src/common/pipes/ParseULIDPipe';
import { UserRole } from 'src/core/domain/entities/user';
import { JwtPayload } from 'src/express';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateCurrentUserDTO } from './dto/update-current-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { CreateUserUseCase } from './usecases/CreateUserUseCase';
import { DeleteUserUseCase } from './usecases/DeleteUserUseCase';
import { GetAllUserUseCase } from './usecases/GetAllUserUseCase';
import { GetMeUseCase } from './usecases/GetMeUseCase';
import { GetOrgsOfUserUseCase } from './usecases/GetOrgsOfUserUseCase';
import { GetUserUseCase } from './usecases/GetUserUseCase';
import { UpdateMeUseCase } from './usecases/UpdateMeUseCase';
import { UpdateUserUseCase } from './usecases/UpdateUserUseCase';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly updateMeUseCase: UpdateMeUseCase,
    private readonly getAllUserUseCase: GetAllUserUseCase,
    private readonly getOrgsOfUserUseCase: GetOrgsOfUserUseCase,
  ) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post(':org_id')
  async create(@Param('org_id') org_id: string, @Body() data: CreateUserDTO) {
    const user = await this.createUserUseCase.execute({
      data,
      org_id,
    });
    return { user: user.fromEntity() };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@GetMe() me: JwtPayload) {
    const user = await this.getMeUseCase.execute(me.id);

    return user.fromEntity();
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMe(@GetMe() me: JwtPayload, @Body() data: UpdateCurrentUserDTO) {
    const user = await this.updateMeUseCase.execute({ id: me.id, data });

    return { user: user.fromEntity() };
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get('all')
  @HttpCode(HttpStatus.OK)
  async getAll(
    @GetMe() me: JwtPayload,
    @Query('org_id', ParseULIDPipe) org_id: string,
    @Query('page', ParseIntPipe) page: number,
  ) {
    const { has_next, users } = await this.getAllUserUseCase.execute({
      owner_id: me.id,
      org_id,
      page,
    });

    return {
      users: users.map((u) => u.fromEntity()),
      has_next,
    };
  }

  @Roles(UserRole.OWNER)
  @Get('orgs')
  @HttpCode(HttpStatus.OK)
  async getOrgs(@GetMe() me: JwtPayload) {
    const orgs = await this.getOrgsOfUserUseCase.execute(me.id);
    return {
      orgs: orgs.map((org) => org.fromEntity()),
    };
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseULIDPipe) userId: string) {
    await this.deleteUserUseCase.execute(userId);

    return { message: 'Delete with sucess !' };
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUser(@Param('id', ParseULIDPipe) userId: string) {
    const user = await this.getUserUseCase.execute(userId);

    return { user: user.fromEntity() };
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id', ParseULIDPipe) userId: string,
    @Body() data: UpdateUserDTO,
  ) {
    const user = await this.updateUserUseCase.execute({ id: userId, data });

    return { user: user.fromEntity() };
  }
}
