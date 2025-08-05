
export enum Status {
  LOADING,
  SUCCESS,
  ERROR,
}

export interface ConnectionStatus {
  db: {
    status: Status;
    customPath: boolean;
  };
  gemini: Status;
  jwt: Status;
}

export interface FullConnectionStatus extends ConnectionStatus {
    usersExist: boolean;
}

export interface User {
    id: number;
    gameName: string;
    firstName?: string;
    lastName?: string;
    birthday?: string;
    pin?: string;
    password?: string;
}
