import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Providers } from './Providers';
import { router } from './Router';
import { useUIStore } from '@/store/uiStore';

export function App() {
  // O tema dos toasts segue o escolhido no app (antes era o do sistema operacional).
  const theme = useUIStore((s) => s.theme);
  return (
    <Providers>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        theme={theme}
        gap={10}
        toastOptions={{
          classNames: {
            toast:
              'rounded-lg border border-border bg-surface/95 text-ink shadow-lg backdrop-blur-xl font-sans',
            title: 'text-sm font-semibold',
            description: 'text-sm text-ink-soft',
          },
        }}
      />
    </Providers>
  );
}
