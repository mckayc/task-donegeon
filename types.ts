
export enum Status {
  LOADING,
  SUCCESS,
  ERROR,
}

export interface ConnectionStatus {
  db: Status;
  gemini: Status;
  jwt: Status;
}
