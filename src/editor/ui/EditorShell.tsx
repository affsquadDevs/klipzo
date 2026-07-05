/**
 * Editor chrome: top toolbar + a workspace slot. Tool/properties panels and the
 * timeline are rendered by the photo/video editors inside the workspace so each
 * owns its own layout. This shell only provides the frame + global actions.
 */
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { SessionMenu } from "./SessionMenu";

interface Props {
  children: ReactNode;
  hasMedia: boolean;
  onReset: () => void;
}

export function EditorShell({ children, hasMedia, onReset }: Props) {
  return (
    <div className="ed-shell">
      <header className="ed-topbar">
        <a href="/" className="ed-brand" aria-label="Klipzo home">
          <span className="ed-logo" aria-hidden />
          <span>Klipzo</span>
        </a>

        <div className="ed-topbar__center" aria-live="polite">
          <span className="ed-privacy-pill" title="Your files never leave this device">
            🔒 On-device · nothing uploaded
          </span>
        </div>

        <div className="ed-topbar__actions">
          {hasMedia && (
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={onReset}>
              New file
            </button>
          )}
          <ThemeToggle />
          <SessionMenu onClearSession={onReset} />
        </div>
      </header>

      <div className="ed-workspace">{children}</div>

      <style>{shellStyles}</style>
    </div>
  );
}

const shellStyles = `
.ed-shell { display: flex; flex-direction: column; height: 100dvh; background: var(--color-bg); }
.ed-topbar {
  display: flex; align-items: center; gap: 1rem; height: var(--spacing-toolbar);
  padding-inline: 0.85rem; border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.ed-brand { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--color-fg); }
.ed-logo { width: 1.25rem; height: 1.25rem; border-radius: 5px; background: linear-gradient(135deg, var(--color-accent), #8a5cff); }
.ed-topbar__center { margin-inline: auto; }
.ed-privacy-pill {
  font-size: 0.78rem; color: var(--color-fg-muted);
  border: 1px solid var(--color-border); border-radius: 999px; padding: 0.3rem 0.7rem;
  white-space: nowrap;
}
.ed-topbar__actions { display: flex; align-items: center; gap: 0.5rem; }
.ed-btn-sm { padding: 0.4rem 0.7rem; font-size: 0.85rem; }
.ed-workspace { flex: 1; min-height: 0; display: flex; }
@media (max-width: 640px) { .ed-topbar__center { display: none; } }
`;
