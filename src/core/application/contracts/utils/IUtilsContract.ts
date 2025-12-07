export interface IUtilsContract {
  generateHash(pwd: string): Promise<string>;

  validateHash(hashPwd: string, pwd: string): Promise<boolean>;

  verifyCepService(cep: string): Promise<boolean>;
}
