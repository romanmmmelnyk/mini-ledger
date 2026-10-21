import type { SVGProps } from 'react';

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const ArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const ArrowUpRight = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Svg>
);
export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const Download = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </Svg>
);
export const Copy = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="3" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </Svg>
);
export const Check = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const Close = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const Chevrons = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />
  </Svg>
);
export const Logout = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />
  </Svg>
);
export const Eye = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
export const EyeOff = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 4l16 16M9.9 5.8A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.2 7.6A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.3 3.8-.8M10 10a2.8 2.8 0 0 0 4 4" />
  </Svg>
);
export const Scale = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 4v16M6 20h12M5 8h14M5 8l-3 7a3.5 3.5 0 0 0 6 0L5 8ZM19 8l-3 7a3.5 3.5 0 0 0 6 0l-3-7Z" />
  </Svg>
);
export const Globe = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3Z" />
  </Svg>
);
export const Swap = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 8h13l-3-3M20 16H7l3 3" />
  </Svg>
);
export const Shield = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6L12 3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Svg>
);
export const Alert = (p: SVGProps<SVGSVGElement>) => (
  <Svg width="18" height="18" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16.2v.1" />
  </Svg>
);
export const ArrowLeft = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);
export const Settings = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </Svg>
);
