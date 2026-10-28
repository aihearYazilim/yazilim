import { Component, type ErrorInfo, type ReactNode } from 'react';
import { store } from '../../state/store';

/**
 * Beklenmeyen bir arayüz hatasında boş ekran yerine güvenli bir mesaj gösterir.
 * Kayıtlar (localStorage) korunur; kullanıcı yedeğini indirebilir.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('DengeYol arayüz hatası', error, info.componentStack);
  }

  private download = () => {
    try {
      const blob = new Blob([store.exportJson()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `dengeyol-yedek-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      /* yok say */
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="screen" role="alert" data-testid="app-error">
        <main className="content">
          <h1>Bir şeyler ters gitti</h1>
          <p className="lead">
            Manevra yapıyorsanız yavaşça oturun ve başınızı düz tutun. Kayıtlarınız silinmedi. Uygulamayı yeniden açarak devam edebilirsiniz.
          </p>
          <button
            className="btn primary block"
            onClick={() => {
              window.location.hash = '#/';
              window.location.reload();
            }}
          >
            Uygulamayı yeniden aç
          </button>
          <button className="btn secondary block" onClick={this.download}>
            Kayıtlarımı indir (yedek)
          </button>
          <p className="small muted">Hata: {this.state.error.message}</p>
        </main>
      </div>
    );
  }
}
