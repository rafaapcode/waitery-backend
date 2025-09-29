import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IAuthContract } from 'src/core/application/contracts/auth/IAuthContract';
import { User, UserRole } from 'src/core/domain/entities/user';
import { HashService } from 'src/hash.service';
import { PrismaService } from 'src/infra/database/database.service';

@Injectable()
export class AuthService implements IAuthContract {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly hashService: HashService,
  ) {}

  async signIn(
    data: IAuthContract.SignInParams,
  ): Promise<IAuthContract.SignInOutput> {
    const getUser = await this.prismaService.user.findUnique({
      where: { email: data.email },
    });

    if (!getUser) {
      throw new NotFoundException('User not found');
    }

    const pwdIsValid = await this.hashService.validateHash(
      getUser.password,
      data.password,
    );

    if (!pwdIsValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const user = new User({
      cpf: getUser.cpf,
      email: getUser.email,
      name: getUser.name ?? '',
      role: UserRole[getUser.role],
      id: getUser.id,
    });

    const token = this.jwtService.sign(user.fromEntity());
    user.id = getUser.id;

    return {
      user,
      access_token: token,
    };
  }

  async signUp(
    data: IAuthContract.SignUpParams,
  ): Promise<IAuthContract.SignUpOutput> {
    const userExists = await this.prismaService.user.findFirst({
      where: { OR: [{ email: data.email }, { cpf: data.cpf }] },
    });

    if (userExists) {
      throw new ConflictException('User already exists');
    }

    const user = new User({
      cpf: data.cpf,
      email: data.email,
      name: data.name,
      role: UserRole.OWNER,
    });

    const hashPwd = await this.hashService.generateHash(data.password);
    user.password = hashPwd;

    const userCreated = await this.prismaService.user.create({
      data: {
        cpf: user.cpf,
        email: user.email,
        password: user.password ?? hashPwd,
        name: user.name,
        role: user.role,
      },
    });

    user.id = userCreated.id;
    const token = this.jwtService.sign(user.fromEntity());

    return {
      user,
      access_token: token,
    };
  }
}
