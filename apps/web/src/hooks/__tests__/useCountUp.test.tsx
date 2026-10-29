import { StrictMode, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountUp } from '../useCountUp';

function strict({ children }: { children: ReactNode }) {
  return <StrictMode>{children}</StrictMode>;
}

describe('useCountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sobe do zero até o alvo mesmo com o efeito duplo do StrictMode', () => {
    const { result } = renderHook(() => useCountUp(42, 300), { wrapper: strict });
    expect(result.current).toBe(0);
    act(() => void vi.advanceTimersByTime(400));
    expect(result.current).toBe(42);
  });

  it('troca de alvo no meio continua de onde o número parou', () => {
    const { result, rerender } = renderHook(({ to }) => useCountUp(to, 300), {
      initialProps: { to: 100 },
    });
    act(() => void vi.advanceTimersByTime(100));
    const midway = result.current;
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(100);

    rerender({ to: 10 });
    act(() => void vi.advanceTimersByTime(400));
    expect(result.current).toBe(10);
  });

  it('com movimento reduzido mostra o valor final direto', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const { result } = renderHook(() => useCountUp(7));
    expect(result.current).toBe(7);
  });
});
