import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { RuntimeErrorBoundary } from '@/app/RuntimeErrorBoundary';
import { reloadOnStaleChunk } from '@/utils/staleChunk';
import '@/i18n';
import '@/styles/tailwind.css';

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
