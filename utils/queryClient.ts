import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    },
  },
});
