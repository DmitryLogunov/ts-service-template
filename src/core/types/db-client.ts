export interface IDBResult {
  data: any[];
  status: boolean;
  message?: string;
}

export interface IDBClient {
  query: (sql: string, values?: string[]) => Promise<IDBResult>;
  close: () => Promise<void>;
  initDB?: (path: string) => void;
}
