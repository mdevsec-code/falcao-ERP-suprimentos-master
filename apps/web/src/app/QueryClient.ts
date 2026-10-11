import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/http/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 s
      gcTime: 1000 * 60 * 5, // 5 min
      refetchOnWindowFocus: false,
      // Erros 4xx (não encontrado, sem permissão, validação) não melhoram
      // repetindo — só tentamos de novo falhas de rede/servidor.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});
