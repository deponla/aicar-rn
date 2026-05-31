import { deleteSession } from "@/api/delete";
import { getActiveSessions } from "@/api/get";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

enum SessionQueryKeys {
  SESSIONS = "sessions",
  ACTIVE_SESSIONS = "active-sessions",
}

export const useActiveSessions = () => {
  return useQuery({
    queryKey: [SessionQueryKeys.ACTIVE_SESSIONS],
    queryFn: getActiveSessions,
  });
};

export const useRevokeSession = () => {
  const query = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      query.invalidateQueries({
        queryKey: [SessionQueryKeys.ACTIVE_SESSIONS],
      });
    },
  });
};
