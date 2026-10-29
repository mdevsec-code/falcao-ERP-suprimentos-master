import { useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { NavigationProgress } from '@/components/layout/NavigationProgress';

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
        {/* `relative`: elementos absolutos da página (ex.: textos sr-only) ficam
            presos à rolagem do <main>; sem isto eles escapavam para o documento
            e esticavam a janela, deixando uma faixa vazia abaixo do app. */}
        <main ref={mainRef} className="scrollbar-thin relative flex-1 overflow-y-auto">
          {/* Entrada da página em CSS puro, remontada por rota. Antes era um
              AnimatePresence mode="wait" do framer-motion: com cliques rápidos no
              menu a saída da página anterior era interrompida e a nova ficava
              presa em opacidade 0 — o módulo abria "em branco". Sem estado de
              saída, não há o que travar. */}
          <div key={pathname} className="animate-rise [animation-duration:320ms]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
