import { Client } from '@googlemaps/google-maps-services-js';
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
      const googleClient = new Client({});
      const address = `${addressInfo.logradouro}, ${addressInfo.bairro}, ${addressInfo.localidade} - ${addressInfo.uf}, ${addressInfo.cep}`;

      const response = await googleClient.geocode({
        params: {
          address: address,
          key: env.GOOGLE_MAPS_API_KEY,
          language: 'pt-BR',
          region: 'BR',
        },
      });

      if (response.data.results.length === 0) {
        return undefined;
      }

      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lon: location.lng,
      };
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
