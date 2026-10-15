import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '../services/profile.api';

const profileKeys = {
  me: ['profile', 'me'] as const,
  wechat: ['profile', 'wechat'] as const,
};

export function useProfile() {
  return useQuery({ queryKey: profileKeys.me, queryFn: profileApi.me });
}

export function useUpdateProfileName() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (name: string) => profileApi.updateName(name),
    onSuccess: (profile) => {
      // Topbar, saudação do Dashboard etc. leem o nome da sessão.
      updateUser({ name: profile.name });
      queryClient.setQueryData(profileKeys.me, profile);
      toast.success(i18n.t('profile:toast.nameUpdated'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('profile:toast.nameError')));
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => profileApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success(i18n.t('profile:toast.passwordChanged'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('profile:toast.passwordError')));
    },
  });
}

export function useWechatStatus() {
  return useQuery({ queryKey: profileKeys.wechat, queryFn: profileApi.wechatStatus });
}

export function useSetWechat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => profileApi.setWechat(token),
    onSuccess: (status) => {
      queryClient.setQueryData(profileKeys.wechat, status);
      toast.success(i18n.t('profile:wechat.connectedToast'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('profile:wechat.error')));
    },
  });
}

export function useRemoveWechat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => profileApi.removeWechat(),
    onSuccess: (status) => {
      queryClient.setQueryData(profileKeys.wechat, status);
      toast.success(i18n.t('profile:wechat.disconnectedToast'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('profile:wechat.error')));
    },
  });
}
