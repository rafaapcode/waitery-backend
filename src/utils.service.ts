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
  async getLatAndLongFromAddress(
    addressInfo: GetAddressInfoOutput,
  ): Promise<{ lat: number; lon: number } | undefined> {
    try {
      const address = `${addressInfo.logradouro}, ${addressInfo.bairro}, ${addressInfo.localidade} - ${addressInfo.uf}, ${addressInfo.cep}, Brazil`;
      const res = await request(
        `${env.OPEN_STREET_MAP_URL}?q=${encodeURIComponent(address)}&format=json&limit=1`,
      );

      const data = (await res.body.json()) as { lat: string; lon: string }[];

      if (data.length === 0) {
        return undefined;
      }

      const { lat, lon } = data[0];
      return { lat: parseFloat(lat), lon: parseFloat(lon) };
    } catch (error) {
      console.log('Error fetching geolocation:', error);
      return undefined;
    }
  }

  async getCepAddressInformations(
    cep: string,
  ): Promise<GetAddressInfoOutput | null | { erro: string }> {
    try {
      const { body, statusCode } = await request(
        `${env.CEP_SERVICE_API_URL}/${cep}/json/`,
      );
      if (statusCode !== 200) {
        return { erro: 'true' };
      }
      const data = await body.json();
      return data as GetAddressInfoOutput;
    } catch (error) {
      console.log('Error fetching CEP information:', error);
      return { erro: 'true' };
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
