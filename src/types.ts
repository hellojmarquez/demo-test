export interface ICreateUser {
  name: string;
  email: string;
  password: string;
  picture?: string;
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  picture: string;
  subaccounts: string[];
  createdAt: string;
  updatedAt: string;
  lastConnection?: string;
  lastConnectionIP?: string;
  role: string;
  status: string;
  permissions: string[];
  _id: string;
  __v: number;
}

export interface ITokenUser {
  name: string;
  email: string;
  picture: string;
  subaccounts: string[];
  createdAt: string;
  updatedAt: string;
  lastConnection?: string;
  lastConnectionIP?: string;
  role: string;
  status: string;
  permissions: string[];
  _id: string;
  __v: number;
}

export interface ISession {
  user: ITokenUser;
  iat: number;
  exp: number;
}
