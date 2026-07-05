import { useState } from "react";
import { clearSession } from "../core/session";

interface Props {
  onClearSession: () => void;
}

/** The visible "Clear session / delete everything" control required by §2.3. */
export function SessionMenu({ onClearSession }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClear() {
    const ok = window.confirm(
      "Delete every open project and all scratch media from this device? This cannot be undone.",
    );
    if (!ok) return;
    setBusy(true);
    try {
      await clearSession();
      onClearSession();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className="k-btn k-btn-ghost ed-btn-sm"
      onClick={handleClear}
      disabled={busy}
      title="Delete all media from this device"
    >
      {busy ? "Clearing…" : "🗑 Clear session"}
    </button>
  );
}
