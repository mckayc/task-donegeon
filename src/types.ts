
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
