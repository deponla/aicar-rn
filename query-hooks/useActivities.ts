import { getActivities } from "@/api/get";
import { ActivityQuery } from "@/types/activity";
import { useQuery } from "@tanstack/react-query";

export enum ActivityQueryKeys {
  ACTIVITIES = "activities",
}

export const useGetActivities = (
  filters?: ActivityQuery,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: [ActivityQueryKeys.ACTIVITIES, filters],
    queryFn: () => getActivities(filters),
    enabled,
  });
};
