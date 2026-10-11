import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
};

export function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[auto_1fr]">
      <Sidebar />
      <div className="flex min-h-0 flex-col">
        <Topbar />
        <main className="scrollbar-thin flex-1 overflow-y-auto">
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
