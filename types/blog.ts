export type BlogContentType = "html" | "markdown";

export interface BlogItem {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  contentType?: BlogContentType;
  coverImage?: string;
  tags?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string;
  scheduledAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogResponse {
  result: BlogItem;
}

export interface BlogListResponse {
  results: BlogItem[];
  page: number;
  limit: number;
  count: number;
}

export interface BlogListFilters {
  page?: number;
  limit?: number;
  sort?: string;
  tag?: string;
  searchTerm?: string;
  publishedOnly?: boolean;
}
