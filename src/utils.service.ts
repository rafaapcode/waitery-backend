import { Injectable } from '@nestjs/common';
import { compare, genSalt, hash } from 'bcryptjs';
import cep from 'cep-promise';
import { request } from 'undici';
import {
  GetAddressInfoOutput,
  IUtilsContract,
} from './core/application/contracts/utils/IUtilsContract';
import { env } from './shared/config/env';

@Injectable()
export class UtilsService implements IUtilsContract {
  async getCepAddressInformations(
    cep: string,
  ): Promise<GetAddressInfoOutput | null> {
    try {
      const { body, statusCode } = await request(
        `${env.CEP_SERVICE_API_URL}/${cep}/json/`,
      );
      if (statusCode !== 200) {
        return null;
      }
      const data = await body.json();
      return data as GetAddressInfoOutput;
    } catch (error) {
      console.log('Error fetching CEP information:', error);
      return null;
    }
  }

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
