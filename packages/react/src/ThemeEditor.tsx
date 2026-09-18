import React, { useEffect, useState } from "react";
import { useDora } from "./DoraProvider";

export interface ThemeVariable {
  /** CSS custom property suffix — rendered as --dora-{key} */
  key: string;
  label: string;
  /** Default hex color used until the client picks their own. */
  default: string;
}

export interface ThemeEditorProps {
  variables: ThemeVariable[];
}

/**
 * Applies saved (or default) colors as CSS custom properties on <html> for
 * every visitor, and — only in authenticated admin mode — renders a small,
 * collapsible color-picker panel the client can use to change them.
 */
export function ThemeEditor({ variables }: ThemeEditorProps) {
  const { content, isAdminMode, isAuthenticated, setContentValue } = useDora();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    for (const v of variables) {
      const stored = content[`theme.${v.key}`];
      const value = stored ? stored.value : v.default;
      document.documentElement.style.setProperty(`--dora-${v.key}`, value);
    }
  }, [content, variables]);

  if (!isAdminMode || !isAuthenticated) return null;

  return (
    <div className={open ? "dora-theme-editor dora-theme-editor--open" : "dora-theme-editor"}>
      <button
        type="button"
        className="dora-theme-editor-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        Theme colors {open ? "▾" : "▸"}
      </button>
      {open && (
        <div className="dora-theme-editor-panel">
          {variables.map((v) => {
            const slotId = `theme.${v.key}`;
            const stored = content[slotId];
            const value = stored ? stored.value : v.default;
            return (
              <label key={v.key} className="dora-theme-editor-row">
                <span>{v.label}</span>
                <input type="color" value={value} onChange={(e) => setContentValue(slotId, "color", e.target.value)} />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
