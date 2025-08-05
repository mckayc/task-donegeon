
export enum Status {
  LOADING,
  SUCCESS,
  ERROR,
  WARNING,
}

export interface ConnectionStatus {
  db: Status;
  gemini: Status;
  jwt: Status;
}

export interface StatusAPIResponse {
    firstRun: boolean;
    db: 'CONNECTED_CUSTOM' | 'CONNECTED_DEFAULT' | 'ERROR';
    gemini: 'CONNECTED' | 'NOT_CONFIGURED';
    jwt: 'CONFIGURED' | 'NOT_CONFIGURED';
}
