import { patchUsers } from "@/api/patch";
import {
  postChangePassword,
  postConfirmUpload,
  postDeleteAccount,
  postDeletePhoto,
  postSendEmailVerification,
  postSendSmsOtp,
  postUploadUrl,
  postVerifySmsOtp,
} from "@/api/post";
import {
  ConfirmUploadRequest,
  DeletePhotoRequest,
  UserUpdateRequest,
} from "@/types/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export enum UserQueryKeys {
  USERS = "users",
}

export const usePatchUsers = () => {
  const query = useQueryClient();
  return useMutation({
    mutationFn: ({ id, d }: { id: string; d: UserUpdateRequest }) =>
      patchUsers(id, d),
    onSuccess: () => {
      query.invalidateQueries({
        queryKey: [UserQueryKeys.USERS],
      });
    },
  });
};

export const useSendEmailVerification = () => {
  return useMutation({
    mutationFn: () => postSendEmailVerification(),
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: postChangePassword,
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: postDeleteAccount,
  });
};

export const useSendSmsOtp = () => {
  return useMutation({
    mutationFn: postSendSmsOtp,
  });
};

export const useVerifySmsOtp = () => {
  const query = useQueryClient();
  return useMutation({
    mutationFn: postVerifySmsOtp,
    onSuccess: () => {
      query.invalidateQueries({
        queryKey: [UserQueryKeys.USERS],
      });
    },
  });
};

export const useUploadUrl = () => {
  return useMutation({
    mutationFn: postUploadUrl,
  });
};

export const useConfirmUpload = () => {
  const query = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConfirmUploadRequest) => postConfirmUpload(payload),
    onSuccess: () => {
      query.invalidateQueries({
        queryKey: [UserQueryKeys.USERS],
      });
    },
  });
};

export const useDeletePhoto = () => {
  const query = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeletePhotoRequest) => postDeletePhoto(payload),
    onSuccess: () => {
      query.invalidateQueries({
        queryKey: [UserQueryKeys.USERS],
      });
    },
  });
};
