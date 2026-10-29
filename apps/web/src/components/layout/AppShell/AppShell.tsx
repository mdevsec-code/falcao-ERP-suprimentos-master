import { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { NavigationProgress } from '@/components/layout/NavigationProgress';

// Troca de página: a nova sobe e ganha nitidez; a antiga só esmaece (sair
// rápido evita a sensação de espera entre telas).
const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
    // `filter` residual (mesmo blur(0)) prenderia elementos `fixed` da página.
    transitionEnd: { filter: 'none' },
  },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export function AppShell() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // O <main> é quem rola (não a janela): sem isto, a página nova abriria na
  // altura de rolagem da anterior.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[auto_1fr]">
      <NavigationProgress />
      <Sidebar />
      <div className="flex min-h-0 flex-col">
        <Topbar />
        <main ref={mainRef} className="scrollbar-thin flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={pathname} {...PAGE_TRANSITION}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
