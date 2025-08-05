

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

export interface AdminUser {
    id: number;
    gameName: string;
}

export interface StatusAPIResponse {
    firstRun: boolean;
    admins: AdminUser[];
    db: 'CONNECTED_CUSTOM' | 'CONNECTED_DEFAULT' | 'ERROR';
    dbPath: string | null;
    gemini: 'CONNECTED' | 'NOT_CONFIGURED';
    jwt: 'CONFIGURED' | 'NOT_CONFIGURED';
}
