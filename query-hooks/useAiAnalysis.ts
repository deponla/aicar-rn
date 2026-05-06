import { postAnalyzeMedia, postAnalyzeObd } from "@/api/post";
import { AnalyzeMediaRequest } from "@/types/ai";
import { useMutation } from "@tanstack/react-query";
import type { AnalyzeObdRequest } from "@/api/post";

export const useAnalyzeMedia = () => {
  return useMutation({
    mutationFn: (payload: AnalyzeMediaRequest) => postAnalyzeMedia(payload),
  });
};

export const useAnalyzeObd = () => {
  return useMutation({
    mutationFn: (payload: AnalyzeObdRequest) => postAnalyzeObd(payload),
  });
};
