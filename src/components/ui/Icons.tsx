import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function base(path: React.ReactNode, viewBox = "0 0 24 24") {
  return ({ className = "h-4 w-4", ...rest }: IconProps) => (
    <svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {path}
    </svg>
  );
}

export const IconGrid = base(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>,
);

export const IconLayers = base(
  <>
    <path d="M12 3 2 8l10 5 10-5-10-5z" />
    <path d="M2 14l10 5 10-5" />
    <path d="M2 11l10 5 10-5" />
  </>,
);

export const IconNetwork = base(
  <>
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="5" cy="5" r="2" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M7 6l3 3M17 6l-3 3M7 18l3-3M17 18l-3-3" />
  </>,
);

export const IconChart = base(
  <>
    <path d="M3 3v18h18" />
    <path d="M7 15l3-4 3 2 5-6" />
  </>,
);

export const IconSparkles = base(
  <>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5L15 9M9 15l-2.5 2.5" />
  </>,
);

export const IconSettings = base(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>,
);

export const IconBell = base(
  <>
    <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </>,
);

export const IconBolt = base(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />);

export const IconUser = base(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>,
);

export const IconSearch = base(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
);

export const IconLink = base(
  <>
    <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 1 0-7-7l-1 1" />
    <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 1 0 7 7l1-1" />
  </>,
);

export const IconArrowRight = base(
  <>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </>,
);

export const IconClose = base(
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
);

export const IconCheck = base(<path d="M5 12l5 5L20 7" />);

export const IconFlame = base(
  <path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 0-2-1-2-1-2s4 1 4 6" />,
);

export const IconBookmark = base(
  <path d="M6 3h12v18l-6-4-6 4z" />,
);

export const IconPlay = base(<path d="M8 5v14l11-7z" />);

export const IconAlert = base(
  <>
    <path d="M12 3 2 20h20z" />
    <path d="M12 10v4" />
    <path d="M12 18h.01" />
  </>,
);

export const IconPlus = base(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
);

export const IconEye = base(
  <>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);

export const IconShield = base(
  <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />,
);

export const IconDatabase = base(
  <>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </>,
);

export const IconBoard = base(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M15 3v18" />
  </>,
);

export const IconTable = base(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18" />
  </>,
);

export const IconFilter = base(
  <path d="M3 5h18l-7 9v6l-4-2v-4z" />,
);

export const IconChat = base(
  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />,
);

export const IconMegaphone = base(
  <>
    <path d="M3 10v4a1 1 0 0 0 1 1h3l7 4V5L7 9H4a1 1 0 0 0-1 1z" />
    <path d="M16 8a4 4 0 0 1 0 8" />
  </>,
);
