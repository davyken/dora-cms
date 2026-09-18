import React, { useCallback, useEffect, useRef } from "react";
import { useDora } from "./DoraProvider";

export interface EditableProps {
  /** Stable identifier for this piece of content within the site, e.g. "hero-title". */
  id: string;
  /** Default content shown until the client saves an override, and for non-admin visitors. */
  children: React.ReactNode;
  /** HTML tag to render. Defaults to "div". */
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}

export function Editable({ id, children, as: Tag = "div", className }: EditableProps) {
  const { content, isAdminMode, isAuthenticated, setContentValue } = useDora();
  const ref = useRef<HTMLElement>(null);
  const savingRef = useRef(false);

  const stored = content[id];
  const displayValue = stored ? stored.value : typeof children === "string" ? children : "";
  const canEdit = isAdminMode && isAuthenticated;

  // Imperatively sync text so we don't fight the contentEditable DOM on
  // every keystroke — React only touches the node when the saved value
  // actually changes (e.g. after a successful save, or on first load).
  // canEdit is also a dependency: the ref only attaches to a DOM node in
  // the contentEditable branch below, so switching into edit mode needs
  // its own sync even when displayValue itself hasn't changed.
  useEffect(() => {
    if (ref.current && ref.current.textContent !== displayValue) {
      ref.current.textContent = displayValue;
    }
  }, [displayValue, canEdit]);

  const handleBlur = useCallback(
    async (e: React.FocusEvent<HTMLElement>) => {
      const next = e.currentTarget.textContent ?? "";
      if (next === displayValue || savingRef.current) return;
      savingRef.current = true;
      try {
        await setContentValue(id, "text", next);
      } finally {
        savingRef.current = false;
      }
    },
    [displayValue, id, setContentValue]
  );

  if (!canEdit) {
    return React.createElement(Tag, { className }, stored ? stored.value : children);
  }

  return React.createElement(Tag, {
    ref,
    className: className ? `${className} dora-editable` : "dora-editable",
    contentEditable: true,
    suppressContentEditableWarning: true,
    onBlur: handleBlur,
  });
}
