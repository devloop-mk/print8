export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <rect x="40" y="280" width="400" height="8" rx="4" fill="white" fillOpacity="0.15" />
      <rect x="72" y="60" width="200" height="128" rx="12" fill="white" fillOpacity="0.12" />
      <rect x="88" y="76" width="168" height="96" rx="8" fill="white" fillOpacity="0.08" />
      <rect x="100" y="100" width="72" height="6" rx="3" fill="white" fillOpacity="0.35" />
      <rect x="100" y="116" width="120" height="4" rx="2" fill="white" fillOpacity="0.2" />
      <rect x="100" y="128" width="96" height="4" rx="2" fill="white" fillOpacity="0.2" />
      <rect x="100" y="148" width="48" height="16" rx="4" fill="#60a5fa" fillOpacity="0.6" />
      <rect x="248" y="48" width="160" height="200" rx="16" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.2" strokeWidth="2" />
      <rect x="268" y="72" width="120" height="80" rx="8" fill="white" fillOpacity="0.15" />
      <circle cx="328" cy="112" r="24" fill="#fbbf24" fillOpacity="0.5" />
      <rect x="268" y="168" width="80" height="6" rx="3" fill="white" fillOpacity="0.3" />
      <rect x="268" y="184" width="112" height="4" rx="2" fill="white" fillOpacity="0.2" />
      <rect x="268" y="196" width="96" height="4" rx="2" fill="white" fillOpacity="0.2" />
      <rect x="268" y="216" width="64" height="20" rx="6" fill="white" fillOpacity="0.25" />
      <rect x="56" y="208" width="144" height="96" rx="10" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.15" strokeWidth="1.5" transform="rotate(-8 56 208)" />
      <rect x="72" y="224" width="80" height="5" rx="2.5" fill="white" fillOpacity="0.3" transform="rotate(-8 72 224)" />
      <rect x="72" y="238" width="56" height="4" rx="2" fill="white" fillOpacity="0.2" transform="rotate(-8 72 238)" />
      <circle cx="380" cy="300" r="56" fill="#34d399" fillOpacity="0.2" />
      <circle cx="380" cy="300" r="36" fill="white" fillOpacity="0.1" />
      <path
        d="M368 300l8 8 16-20"
        stroke="white"
        strokeOpacity="0.6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="120" cy="340" r="6" fill="#f472b6" fillOpacity="0.5" />
      <circle cx="200" cy="320" r="4" fill="#a78bfa" fillOpacity="0.5" />
      <circle cx="300" cy="348" r="5" fill="#38bdf8" fillOpacity="0.5" />
    </svg>
  );
}
