import { patchUsers } from "@/api/patch";
import {
  postChangePassword,
  postDeleteAccount,
  postIdentityVerification,
  postSendEmailVerification,
  postSendSmsOtp,
  postVerifySmsOtp,
} from "@/api/post";
import { IdentityVerificationRequest, UserUpdateRequest } from "@/types/user";
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

export const useIdentityVerification = () => {
  return useMutation({
    mutationFn: (d: IdentityVerificationRequest) => postIdentityVerification(d),
  });
};
