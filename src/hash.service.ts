import { Injectable } from '@nestjs/common';
import { compare, genSalt, hash } from 'bcryptjs';

@Injectable()
export class HashService {
  async generateHash(pwd: string): Promise<string> {
    const salt = await genSalt(10);
    const pwdHash = await hash(pwd, salt);
    return pwdHash;
  }

  async validateHash(hashPwd: string, pwd: string): Promise<boolean> {
    return await compare(pwd, hashPwd);
  }
}
