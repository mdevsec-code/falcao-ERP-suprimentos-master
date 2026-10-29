import { useUIStore } from '@/store/uiStore';

/**
 * Tema atual e ações para trocá-lo. A classe `dark` no `<html>` é aplicada
 * em `main.tsx` (antes do primeiro render e a cada mudança da store).
 */
export function useTheme() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return { theme, setTheme, toggle };
}
