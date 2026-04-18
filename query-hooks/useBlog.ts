import { getBlogBySlug, getBlogs } from "@/api/get";
import { BlogListFilters } from "@/types/blog";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export enum BlogQueryKey {
  BLOG = "BLOG",
}

export const useGetBlogs = ({
  enabled = true,
  filters,
}: {
  enabled?: boolean;
  filters?: BlogListFilters;
}) => {
  return useQuery({
    queryKey: [BlogQueryKey.BLOG, filters],
    queryFn: () => getBlogs({ filters }),
    enabled,
  });
};

export const useGetBlogsInfinite = ({
  enabled = true,
  filters,
}: {
  enabled?: boolean;
  filters?: Omit<BlogListFilters, "page">;
}) => {
  return useInfiniteQuery({
    queryKey: [BlogQueryKey.BLOG, "infinite", filters],
    queryFn: ({ pageParam = 0 }) =>
      getBlogs({ filters: { ...filters, page: pageParam, limit: 20 } }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.results.length >= (lastPage.limit || 20);
      return hasMore ? lastPage.page + 1 : undefined;
    },
    enabled,
  });
};

export const useGetBlogBySlug = ({
  enabled = true,
  slug,
}: {
  enabled?: boolean;
  slug?: string;
}) => {
  return useQuery({
    queryKey: [BlogQueryKey.BLOG, slug],
    queryFn: () => getBlogBySlug({ slug: slug! }),
    enabled: !!slug && enabled,
  });
};
