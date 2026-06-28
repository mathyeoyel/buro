import { useId } from "react";
import "./Input.css";

/**
 * Labeled text input.
 */
export default function Input({
  label,
  hint,
  id,
  type = "text",
  className = "",
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={["buro-field", className].filter(Boolean).join(" ")}>
      {label && (
        <label className="buro-field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId} type={type} className="buro-field__input" {...rest} />
      {hint && <span className="buro-field__hint">{hint}</span>}
    </div>
  );
}
