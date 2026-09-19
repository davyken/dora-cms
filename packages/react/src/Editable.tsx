import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDora } from "./DoraProvider";

export interface EditableProps {
  /** Stable identifier for this piece of content within the site, e.g. "hero-title". */
  id: string;
  /** Default content shown until the client saves an override, and for non-admin visitors. */
  children: React.ReactNode;
  /** HTML tag to render. Defaults to "div". */
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  /**
   * Shows a small bold/italic/link toolbar and saves as sanitized HTML
   * ("richtext") instead of plain text. Off by default — most fields (a
   * heading, a label) don't need formatting, and turning it on for every
   * field would mean every field pays for the toolbar's screen space.
   */
  richText?: boolean;
}

export function Editable({ id, children, as: Tag = "div", className, richText = false }: EditableProps) {
  const { content, isAdminMode, isAuthenticated, setContentValue } = useDora();
  const ref = useRef<HTMLElement>(null);
  const savingRef = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);
  const [linkBarOpen, setLinkBarOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const stored = content[id];
  const displayValue = stored ? stored.value : typeof children === "string" ? children : "";
  const canEdit = isAdminMode && isAuthenticated;

  // Imperatively sync content so we don't fight the contentEditable DOM on
  // every keystroke — React only touches the node when the saved value
  // actually changes (e.g. after a successful save, or on first load).
  // canEdit is also a dependency: the ref only attaches to a DOM node in
  // the contentEditable branch below, so switching into edit mode needs
  // its own sync even when displayValue itself hasn't changed.
  useEffect(() => {
    if (!ref.current) return;
    if (richText) {
      if (ref.current.innerHTML !== displayValue) ref.current.innerHTML = displayValue;
    } else if (ref.current.textContent !== displayValue) {
      ref.current.textContent = displayValue;
    }
  }, [displayValue, canEdit, richText]);

  const handleBlur = useCallback(
    async (e: React.FocusEvent<HTMLElement>) => {
      const next = richText ? e.currentTarget.innerHTML : (e.currentTarget.textContent ?? "");
      if (next === displayValue || savingRef.current) return;
      savingRef.current = true;
      try {
        await setContentValue(id, richText ? "richtext" : "text", next);
      } finally {
        savingRef.current = false;
      }
    },
    [displayValue, id, richText, setContentValue]
  );

  // execCommand is deprecated, but remains the pragmatic choice for a
  // lightweight bold/italic/link toolbar without pulling in a full editor
  // library (TipTap, Lexical, ...) — still broadly supported for these
  // basic commands across current browsers. Guarded for environments where
  // it's genuinely absent (e.g. it's unimplemented in jsdom, so tests can't
  // exercise the actual formatting, only that the buttons render and don't
  // throw).
  const exec = (command: string, value?: string) => {
    ref.current?.focus();
    if (typeof document.execCommand === "function") {
      document.execCommand(command, false, value);
    }
  };

  const handleLinkButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    setLinkBarOpen((prev) => !prev);
  };

  const handleApplyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    ref.current?.focus();
    const selection = window.getSelection();
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
    if (linkUrl.trim()) exec("createLink", linkUrl.trim());
    setLinkUrl("");
    setLinkBarOpen(false);
  };

  if (!canEdit) {
    if (richText && stored) {
      // Sanitized server-side (allow-listed tags only) before storage.
      return React.createElement(Tag, { className, dangerouslySetInnerHTML: { __html: stored.value } });
    }
    return React.createElement(Tag, { className }, stored ? stored.value : children);
  }

  return (
    <>
      {richText && (
        <span className="dora-richtext-toolbar">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("bold");
            }}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("italic");
            }}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button type="button" onMouseDown={handleLinkButtonMouseDown} title="Link">
            Link
          </button>
          {linkBarOpen && (
            <span className="dora-richtext-link-bar">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                onMouseDown={(e) => e.stopPropagation()}
              />
              <button type="button" onMouseDown={handleApplyLink}>
                Apply
              </button>
            </span>
          )}
        </span>
      )}
      {React.createElement(Tag, {
        ref,
        className: className ? `${className} dora-editable` : "dora-editable",
        contentEditable: true,
        suppressContentEditableWarning: true,
        onBlur: handleBlur,
      })}
    </>
  );
}
