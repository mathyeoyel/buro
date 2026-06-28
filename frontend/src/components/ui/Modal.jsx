import { useEffect } from "react";
import "./Modal.css";

/**
 * Centered modal dialog. Closes on backdrop click or Escape.
 */
export default function Modal({ open, onClose, title, children, footer }) {
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
    <div className="buro-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="buro-modal__backdrop" onClick={onClose} />
      <div className="buro-modal__panel">
        {title && <h2 className="buro-modal__title">{title}</h2>}
        <div className="buro-modal__body">{children}</div>
        {footer && <div className="buro-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
