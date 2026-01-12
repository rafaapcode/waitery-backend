export type GetAddressInfoOutput = {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
};

export interface IUtilsContract {
  generateHash(pwd: string): Promise<string>;

  validateHash(hashPwd: string, pwd: string): Promise<boolean>;

  verifyCepService(cep: string): Promise<boolean>;

  getCepAddressInformations(cep: string): Promise<GetAddressInfoOutput | null>;
}
