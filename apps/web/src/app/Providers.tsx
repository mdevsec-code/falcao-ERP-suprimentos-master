import { Suspense, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { MotionConfig } from 'framer-motion';
import { TooltipProvider } from '@/components/ui';
import { queryClient } from './QueryClient';
import i18n from '@/i18n';
import { LoadingState } from '@/components/feedback/LoadingState';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={150}>
          <MotionConfig reducedMotion="user">
            <Suspense fallback={<LoadingState />}>{children}</Suspense>
          </MotionConfig>
        </TooltipProvider>
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        )}
      </QueryClientProvider>
    </I18nextProvider>
  );
}
