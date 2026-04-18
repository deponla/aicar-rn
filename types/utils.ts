export interface IPagination {
  page: number;
  limit: number;
}

export interface ErrorResponse {
  errors: string[];
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
}
