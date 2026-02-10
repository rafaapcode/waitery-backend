/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from 'src/common/decorators/IsPublic';
import { SignInAuthDTO } from './dto/signIn-auth.dto';
import { SignUpAuthDTO } from './dto/signUp-auth.dto';
import { SignInUseCase } from './usecases/SignInUseCase';
import { SignUpUseCase } from './usecases/SignUpUseCase';

@ApiTags('Authentication')
@IsPublic()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signInUseCase: SignInUseCase,
    private readonly signUpUseCase: SignUpUseCase,
  ) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body() data: SignInAuthDTO,
    @Request() request: Request,
    @Ip() ip: string,
  ) {
    const userAgent = request.headers['user-agent'] || 'unknown';

    const { user, access_token } = await this.signInUseCase.execute(
      data,
      userAgent,
      ip,
    );

    return {
      ...user.fromEntity(),
      access_token,
    };
  }

  @Post('signup')
  async signup(
    @Body() data: SignUpAuthDTO,
    @Request() request: Request,
    @Ip() ip: string,
  ) {
    const userAgent = request.headers['user-agent'] || 'unknown';
    const { user, access_token } = await this.signUpUseCase.execute(
      data,
      userAgent,
      ip,
    );
    return {
      ...user.fromEntity(),
      access_token,
    };
  }
}
