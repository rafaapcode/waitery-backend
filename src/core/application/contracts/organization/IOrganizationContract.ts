import { Organization } from 'src/core/domain/entities/organization';
import { GetAddressInfoOutput } from '../utils/IUtilsContract';

export interface IOrganizationContract {
  create(
    params: IOrganizationContract.CreateParams,
  ): Promise<IOrganizationContract.CreateOutput>;

  update(
    params: IOrganizationContract.UpdateParams,
  ): Promise<IOrganizationContract.UpdateOutput>;

  delete(
    params: IOrganizationContract.DeleteParams,
  ): Promise<IOrganizationContract.DeleteOutput>;

  get(
    params: IOrganizationContract.GetParams,
  ): Promise<IOrganizationContract.GetOutput>;

  getAll(
    params: IOrganizationContract.GetAllParams,
  ): Promise<IOrganizationContract.GetAllOutput>;

  verifyOrgById(
    params: IOrganizationContract.VerifyOrgsParamsById,
  ): Promise<IOrganizationContract.VerifyOrgsOutput>;

  verifyOrgByName(
    params: IOrganizationContract.VerifyOrgsParamsByName,
  ): Promise<IOrganizationContract.VerifyOrgsOutput>;

  verifyCep(
    params: IOrganizationContract.VerifyCepParams,
  ): Promise<IOrganizationContract.VerifyCepOutput>;

  getAddressInformation(
    params: string,
  ): Promise<IOrganizationContract.GetAddressInformationOutput | null>;
}

export namespace IOrganizationContract {
  export type CreateParams = {
    owner_id: string;
    data: {
      id?: string;
      name: string;
      email: string;
      description: string;
      location_code: string;
      open_hour: number;
      close_hour: number;
      cep: string;
      city: string;
      neighborhood: string;
      street: string;
      lat: number;
      long: number;
      image_url: string;
    };
  };

  export type CreateOutput = Organization;

  export type UpdateParams = {
    id: string;
    data: {
      name?: string;
      image_url?: string;
      email?: string;
      description?: string;
      location_code?: string;
      open_hour?: number;
      close_hour?: number;
      cep?: string;
      city?: string;
      neighborhood?: string;
      street?: string;
      lat?: number;
      long?: number;
    };
  };

  export type UpdateOutput = Organization;

  export type DeleteParams = {
    id: string;
  };

  export type DeleteOutput = void;

  export type GetParams = {
    id: string;
  };

  export type GetOutput = Organization | null;

  export type GetAllParams = {
    owner_id: string;
  };

  export type GetAllOutput = Organization[] | null;

  export type VerifyOrgsParamsById = {
    owner_id: string;
    org_id: string;
  };

  export type VerifyOrgsParamsByName = {
    owner_id: string;
    name: string;
  };

  export type VerifyOrgsOutput = boolean;

  export type VerifyCepParams = string;

  export type VerifyCepOutput = boolean;

  export type GetAddressInformationOutput = GetAddressInfoOutput;
}
