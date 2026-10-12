type TripSquadLogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export function TripSquadLogo({ className = '', showWordmark = true }: TripSquadLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 32 24"
        width="32"
        height="24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Group members / starting points */}
        <circle cx="4" cy="4" r="2" fill="currentColor" />
        <circle cx="4" cy="12" r="2" fill="currentColor" />
        <circle cx="4" cy="20" r="2" fill="currentColor" />

        {/* Converging paths */}
        <path
          d="M8 4C12 4 14 8 18 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M8 12H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M8 20C12 20 14 16 18 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Shared direction */}
        <path
          d="M18 7L27 12L18 17"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark && (
        <span className="text-xl font-semibold tracking-tight text-slate-900">
          Trip<span className="text-brand-600">Squad</span>
        </span>
      )}
    </div>
  );
}
