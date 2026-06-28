import { useEffect } from "react";
import "./BottomSheet.css";

/**
 * Mobile-first bottom sheet. Slides up from the bottom edge.
 */
export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="buro-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="buro-sheet__backdrop" onClick={onClose} />
      <div className="buro-sheet__panel">
        <div className="buro-sheet__grabber" aria-hidden="true" />
        {title && <h2 className="buro-sheet__title">{title}</h2>}
        <div className="buro-sheet__body">{children}</div>
      </div>
    </div>
  );
}
