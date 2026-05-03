import { postCreateFeedback } from "@/api/post";
import { CreateFeedbackRequest } from "@/types/feedback";
import { useMutation } from "@tanstack/react-query";

export const useCreateFeedback = () => {
  return useMutation({
    mutationFn: (payload: CreateFeedbackRequest) => postCreateFeedback(payload),
  });
};
