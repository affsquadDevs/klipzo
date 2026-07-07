/**
 * Editor chrome: top toolbar + a workspace slot. Tool/properties panels and the
 * timeline are rendered by the photo/video editors inside the workspace so each
 * owns its own layout. This shell only provides the frame + global actions.
 */
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { SessionMenu } from "./SessionMenu";
import { FUTURE, isConfigured } from "../../config/site";

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
          <span className="ed-logo" aria-hidden>
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="edLogoGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#4f7cff" />
                  <stop offset="1" stopColor="#8a5cff" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#edLogoGrad)" />
              <path
                d="M11 8v16M11 16l9-8M11 16l9 8"
                fill="none"
                stroke="#fff"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
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

      {isConfigured(FUTURE.donationLink) && (
        <footer className="ed-statusbar">
          <a
            className="ed-support"
            href={FUTURE.donationLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Klipzo is free and never uploads your files — support keeps it that way"
          >
            <span aria-hidden>❤️</span> Support Klipzo
          </a>
        </footer>
      )}

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
.ed-logo { width: 1.4rem; height: 1.4rem; flex: none; display: block; }
.ed-logo svg { display: block; width: 100%; height: 100%; }
.ed-topbar__center { margin-inline: auto; }
.ed-privacy-pill {
  font-size: 0.78rem; color: var(--color-fg-muted);
  border: 1px solid var(--color-border); border-radius: 999px; padding: 0.3rem 0.7rem;
  white-space: nowrap;
}
.ed-topbar__actions { display: flex; align-items: center; gap: 0.5rem; }
.ed-btn-sm { padding: 0.4rem 0.7rem; font-size: 0.85rem; }
.ed-workspace { flex: 1; min-height: 0; display: flex; }
.ed-statusbar {
  flex: none; display: flex; align-items: center; justify-content: flex-end;
  height: 1.75rem; padding-inline: 0.85rem;
  border-top: 1px solid var(--color-border); background: var(--color-surface);
}
.ed-support {
  display: inline-flex; align-items: center; gap: 0.35rem;
  font-size: 0.75rem; line-height: 1; color: var(--color-fg-subtle);
  transition: color 0.15s ease;
}
.ed-support:hover { color: var(--color-fg-muted); }
@media (max-width: 640px) { .ed-topbar__center { display: none; } }
`;
