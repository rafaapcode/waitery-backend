import { Injectable } from '@nestjs/common';
import { compare, genSalt, hash } from 'bcryptjs';
import cep from 'cep-promise';
import { IUtilsContract } from './core/application/contracts/utils/IUtilsContract';

@Injectable()
export class UtilsService implements IUtilsContract {
  async verifyCepService(param: string): Promise<boolean> {
    try {
      await cep(param);
      return true;
    } catch (error) {
      console.log('CEP verification error:', error);
      return false;
    }
  }

  async generateHash(pwd: string): Promise<string> {
    const salt = await genSalt(10);
    const pwdHash = await hash(pwd, salt);
    return pwdHash;
  }

  async validateHash(hashPwd: string, pwd: string): Promise<boolean> {
    return await compare(pwd, hashPwd);
  }
}
