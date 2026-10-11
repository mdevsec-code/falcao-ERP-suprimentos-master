import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '../services/profile.api';

const profileKeys = { me: ['profile', 'me'] as const };

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
