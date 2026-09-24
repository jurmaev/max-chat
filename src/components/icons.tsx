import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const SendIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12h13M12 5l7 7-7 7" />
  </svg>
);

export const LogoutIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const BackIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...base} width={14} height={14} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export const DoubleCheckIcon = (p: IconProps) => (
  <svg {...base} width={18} height={16} viewBox="0 0 28 24" {...p}>
    <path d="M2 12.5l5 5L18 6.5M13 16l1.5 1.5L25.5 6.5" />
  </svg>
);

export const AlertIcon = (p: IconProps) => (
  <svg {...base} width={16} height={16} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.01" />
  </svg>
);
