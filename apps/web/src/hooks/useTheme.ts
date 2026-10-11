import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

/**
 * Hook que aplica o tema atual ao `<html>` (classe `dark` ou nada)
 * e persiste a escolha do usuário.
 */
export function useTheme() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return { theme, setTheme, toggle };
}
