export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  WAITER = 'WAITER',
  OWNER = 'OWNER',
}

export class User {
  id?: string;
  readonly org_ids: string[];
  readonly name: string;
  readonly email: string;
  readonly cpf: string;
  password?: string;
  readonly role: UserRole;

  constructor(data: User.Attr) {
    if (data.id) this.id = data.id;
    if (data.password) this.password = data.password;
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.cpf = data.cpf;
    this.org_ids = data.org_ids ?? [];
  }

  fromEntity() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      cpf: this.cpf,
      role: this.role,
      org_ids: this.org_ids,
    };
  }

  toObject() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      cpf: this.cpf,
      role: this.role,
      org_ids: this.org_ids,
      password: this.password,
    };
  }
}

namespace User {
  export type Attr = {
    id?: string;
    org_ids?: string[];
    name: string;
    email: string;
    cpf: string;
    password?: string;
    role: UserRole;
  };
}

export const createUserEntity = (data: User.Attr): User => new User(data);
