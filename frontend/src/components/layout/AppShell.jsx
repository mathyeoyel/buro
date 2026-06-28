import BuroLogo from "../brand/BuroLogo";
import "./AppShell.css";

/**
 * Top-level app header bar with the Buro wordmark and optional trailing slot.
 */
export default function AppShell({ trailing = null }) {
  return (
    <header className="buro-appshell">
      <BuroLogo size="md" />
      <div className="buro-appshell__trailing">{trailing}</div>
    </header>
  );
}
