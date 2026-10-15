import React, { useEffect, useState } from 'react';

/** Keep incomplete decimal keystrokes local; commit only a finished value. */
export function FontSizeInput({ value, label, onCommit, className }: {
  value: number; label: string; onCommit: (value: number) => void; className: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return <input type="text" inputMode="decimal" value={draft} aria-label={label}
    className={className}
    onChange={event => setDraft(event.target.value)}
    onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }}
    onBlur={() => {
      const text = draft.trim();
      const next = Number(text);
      if (text && Number.isFinite(next) && next > 0) onCommit(next);
      // A rejected edit must show the actual value, not a misleading draft.
      setDraft(String(value));
    }} />;
}
