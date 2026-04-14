export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface ApiEnvelope<T> {
  code: number;
  msg: string;
  data: T;
}
