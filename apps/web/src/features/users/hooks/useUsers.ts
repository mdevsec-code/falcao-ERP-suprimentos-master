import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usersApi } from '../services/users.api';
import type { UserListParams } from '../types';

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...usersKeys.lists(), params] as const,
  stats: () => [...usersKeys.all, 'stats'] as const,
};

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: usersKeys.stats(),
    queryFn: usersApi.stats,
  });
}
