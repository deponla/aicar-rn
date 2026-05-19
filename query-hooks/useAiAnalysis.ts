import { postAnalyzeMedia } from "@/api/post";
import { AnalyzeMediaRequest } from "@/types/ai";
import { useMutation } from "@tanstack/react-query";

export const useAnalyzeMedia = () => {
  return useMutation({
    mutationFn: (payload: AnalyzeMediaRequest) => postAnalyzeMedia(payload),
  });
};
