import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { RuntimeErrorBoundary } from '@/app/RuntimeErrorBoundary';
import { reloadOnStaleChunk } from '@/utils/staleChunk';
import { useUIStore, type Theme } from '@/store/uiStore';
import '@/i18n';
import '@/styles/tailwind.css';

// Tema aplicado antes do primeiro render (a store persistida hidrata de forma
// síncrona) e mantido em sincronia daqui em diante — sem isto o tema escuro só
// entrava quando algum ThemeToggle montava, com um clarão claro a cada carga
// e telas sem o toggle (404, erro) sempre no claro.
function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
applyTheme(useUIStore.getState().theme);
useUIStore.subscribe((state) => applyTheme(state.theme));

// Arquivo de uma versão anterior que o deploy apagou: recarrega para pegar a nova.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnStaleChunk(event.payload)) event.preventDefault();
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('Elemento #root não encontrado em index.html');
}

createRoot(container).render(
  <StrictMode>
    <RuntimeErrorBoundary>
      <App />
    </RuntimeErrorBoundary>
  </StrictMode>,
);
