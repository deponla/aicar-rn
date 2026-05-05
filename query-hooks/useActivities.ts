import { getActivities } from "@/api/get";
import { ActivityQuery } from "@/types/activity";
import { useQuery } from "@tanstack/react-query";

export enum ActivityQueryKeys {
  ACTIVITIES = "activities",
}

export const useGetActivities = (filters?: ActivityQuery) => {
  return useQuery({
    queryKey: [ActivityQueryKeys.ACTIVITIES, filters],
    queryFn: () => getActivities(filters),
  });
};
