import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IsPublic } from 'src/common/decorators/IsPublic';
import { SignInAuthDTO } from './dto/signIn-auth.dto';
import { SignUpAuthDTO } from './dto/signUp-auth.dto';
import { SignInUseCase } from './usecases/SignInUseCase';
import { SignUpUseCase } from './usecases/SignUpUseCase';

@IsPublic()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signInUseCase: SignInUseCase,
    private readonly signUpUseCase: SignUpUseCase,
  ) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() data: SignInAuthDTO) {
    const { user, access_token } = await this.signInUseCase.execute(data);
    return {
      user: user.fromEntity(),
      access_token,
    };
  }

  @Post('signup')
  async signup(@Body() data: SignUpAuthDTO) {
    const { user, access_token } = await this.signUpUseCase.execute(data);
    return {
      user: user.fromEntity(),
      access_token,
    };
  }
}
