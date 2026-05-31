import { getFeedbacks } from "@/api/get";
import { postCreateFeedback } from "@/api/post";
import { CreateFeedbackRequest, FeedbackQuery } from "@/types/feedback";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

enum FeedbackQueryKeys {
  FEEDBACKS = "feedbacks",
}

export const useGetFeedbacks = (filters?: FeedbackQuery) => {
  return useQuery({
    queryKey: [FeedbackQueryKeys.FEEDBACKS, filters],
    queryFn: () => getFeedbacks(filters),
  });
};

export const useCreateFeedback = () => {
  const query = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFeedbackRequest) => postCreateFeedback(payload),
    onSuccess: () => {
      query.invalidateQueries({
        queryKey: [FeedbackQueryKeys.FEEDBACKS],
      });
    },
  });
};
