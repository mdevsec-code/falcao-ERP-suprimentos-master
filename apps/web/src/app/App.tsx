import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Providers } from './Providers';
import { router } from './Router';

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        theme="system"
        toastOptions={{
          classNames: {
            toast: 'rounded-lg border border-border bg-surface text-ink shadow-md font-sans',
            title: 'text-sm font-semibold',
            description: 'text-sm text-ink-soft',
          },
        }}
      />
    </Providers>
  );
}
