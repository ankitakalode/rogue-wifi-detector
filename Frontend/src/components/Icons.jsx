export function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <polygon points="30,8 52,19 52,41 30,52 8,41 8,19" fill="none" stroke="#35D0B8" strokeWidth="2.5" />
      <circle cx="30" cy="30" r="13" fill="none" stroke="#35D0B8" strokeWidth="1" />
      <path d="M30,30 L30,17 A13,13 0 0 1 38,21 Z" fill="#35D0B8" fillOpacity="0.35" />
      <circle cx="30" cy="30" r="2" fill="#35D0B8" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#35D0B8" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4,20 C4,15.5 7.5,13 12,13 C16.5,13 20,15.5 20,20" />
    </svg>
  );
}