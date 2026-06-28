import "./MobileShell.css";

/**
 * Constrains content to a mobile-first column, centered on larger screens.
 * Optional sticky header and bottom navigation slots.
 */
export default function MobileShell({ header, children, bottomNav }) {
  return (
    <div className="buro-mobile-shell">
      <div className="buro-mobile-shell__frame">
        {header && <div className="buro-mobile-shell__header">{header}</div>}
        <main className="buro-mobile-shell__main">{children}</main>
        {bottomNav && <div className="buro-mobile-shell__nav">{bottomNav}</div>}
      </div>
    </div>
  );
}
