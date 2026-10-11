import { useEffect, useState } from 'react';

/**
 * Atrasa a atualização de um valor por `delay` ms.
 * Útil para inputs de busca que disparam queries em massa.
 */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debouncedValue;
}
