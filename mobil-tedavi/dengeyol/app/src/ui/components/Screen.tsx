import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

export function Screen({
  title,
  back,
  onBack,
  right,
  children,
  footer,
  wide
}: {
  title?: string;
  back?: string | true;
  onBack?: () => void;
  right?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const nav = useNavigate();
  const goBack = () => {
    if (onBack) return onBack();
    if (back === true) nav(-1);
    else if (typeof back === 'string') nav(back);
  };
  return (
    <div className={`screen${wide ? ' wide' : ''}`}>
      {(title || back || onBack || right) && (
        <header className="topbar">
          {back || onBack ? (
            <button className="btn icon" onClick={goBack} aria-label="Geri">
              <Icon name="back" />
            </button>
          ) : (
            <span style={{ width: 8 }} />
          )}
          <div className="title">{title}</div>
          {right}
        </header>
      )}
      <main className="content">{children}</main>
      {footer && <div className="footer-actions">{footer}</div>}
    </div>
  );
}
