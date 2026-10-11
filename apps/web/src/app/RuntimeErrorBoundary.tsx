import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Boundary de último recurso. Captura qualquer erro de renderização
 * que escape dos boundaries do React Router e exibe a stack na tela,
 * evitando o "tela em branco" sem diagnóstico.
 */
export class RuntimeErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[RuntimeErrorBoundary]', error, info);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    const err = this.state.error;
    return (
      <div
        style={{
          minHeight: '100vh',
          padding: 24,
          background: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        <h1 style={{ fontSize: 18, marginBottom: 8, color: '#fca5a5' }}>
          {i18n.t('common:errorBoundary.crashTitle')}
        </h1>
        <p style={{ marginBottom: 16, color: '#cbd5e1' }}>
          {i18n.t('common:errorBoundary.crashDescription')}
        </p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#020617',
            border: '1px solid #1e293b',
            borderRadius: 8,
            padding: 16,
            margin: 0,
          }}
        >
          <strong style={{ color: '#fbbf24' }}>{err.name}:</strong> {err.message}
          {'\n\n'}
          {err.stack}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 16,
            padding: '8px 14px',
            background: '#f59e0b',
            color: '#0f172a',
            border: 0,
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {i18n.t('common:errorBoundary.reload')}
        </button>
      </div>
    );
  }
}
