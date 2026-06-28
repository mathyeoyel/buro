/**
 * Buro icon set — lightweight, consistent inline SVGs.
 * Stroke-based, 24x24 viewBox, inherits `currentColor`. No gradients.
 *
 * name: rooms | start | profile | chat | react | mic | micOff | more | back
 *     | report | admin | leave | end | edit | close | plus | send | remove | block | users
 */
const PATHS = {
  rooms: (
    <>
      <path d="M4 5h11a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H9l-4 3v-3a3 3 0 0 1-3-3V8" />
      <path d="M8 9h6M8 12h4" />
    </>
  ),
  start: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  chat: (
    <>
      <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3V7a2 2 0 0 1 2-2Z" />
      <path d="M8 10h8M8 13h5" />
    </>
  ),
  react: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 14a4 4 0 0 0 6 0" />
      <path d="M9 9h.01M15 9h.01" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
    </>
  ),
  micOff: (
    <>
      <path d="M9 5a3 3 0 0 1 6 0v4M15 12.5V11" />
      <path d="M6 11a6 6 0 0 0 9.2 5.1M18 11a6 6 0 0 1-.4 2.2" />
      <path d="M12 17v4" />
      <path d="M4 4l16 16" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  report: (
    <>
      <path d="M5 21V4" />
      <path d="M5 5h11l-2 4 2 4H5" />
    </>
  ),
  admin: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  leave: (
    <>
      <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
      <path d="M9 8l-4 4 4 4M5 12h10" />
    </>
  ),
  end: (
    <>
      <circle cx="12" cy="12" r="9" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 6.5l3 3" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  send: <path d="M5 12l15-7-7 15-2-6-6-2Z" />,
  remove: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M3 20a6 6 0 0 1 11-3.3" />
      <path d="M16 16l5 5M21 16l-5 5" />
    </>
  ),
  block: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M6 6l12 12" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3.5 3.5 0 0 1 0 6.8M21 19a6 6 0 0 0-4-5.7" />
    </>
  ),
};

export default function Icon({ name, size = 22, strokeWidth = 2, className = "", title }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      className={["buro-icon", className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {path}
    </svg>
  );
}
