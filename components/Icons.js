const Svg = ({ size = 24, children, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const WaveIcon = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 18c5 0 5-5 10-5s5 5 10 5 5-5 10-5" />
    <path d="M6 30c5 0 5-5 10-5s5 5 10 5 5-5 10-5" />
  </svg>
);

export const CartIcon = ({ size = 24 }) => (
  <Svg size={size}>
    <circle cx="8" cy="21" r="1.2" />
    <circle cx="19" cy="21" r="1.2" />
    <path d="M2.1 2.6h2.4l2.6 12.3a1.8 1.8 0 0 0 1.8 1.5h9.6a1.8 1.8 0 0 0 1.8-1.4l1.6-7.4H5.4" />
  </Svg>
);

export const ClipboardIcon = ({ size = 24 }) => (
  <Svg size={size}>
    <rect x="8" y="2.5" width="8" height="4" rx="1.2" />
    <path d="M16 4.5h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h2" />
    <path d="M9 12.5h6M9 16.5h4" />
  </Svg>
);

export const ChefHatIcon = ({ size = 24 }) => (
  <Svg size={size}>
    <path d="M17 21.5a1 1 0 0 0 1-1v-5.4c0-.5.1-.9.35-1.3a7 7 0 1 0-12.7 0c.25.4.35.8.35 1.3v5.4a1 1 0 0 0 1 1Z" />
    <path d="M6 21.5h12" />
  </Svg>
);

export const CheckCircleIcon = ({ size = 24 }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="m8.8 12.3 2.2 2.2 4.2-4.4" />
  </Svg>
);

export const UtensilsIcon = ({ size = 24 }) => (
  <Svg size={size}>
    <path d="M5 3v7a2 2 0 0 0 2 2h1v9" />
    <path d="M8 3v6" />
    <path d="M17 3c-1.5 0-3 2-3 5.5S15.5 13 17 13v8" />
    <path d="M17 3c1.5 0 2 2 2 4.5" />
  </Svg>
);

export const BoxEmptyIcon = ({ size = 24 }) => (
  <Svg size={size}>
    <path d="M3 7l9-4 9 4v10l-9 4-9-4Z" />
    <path d="M3 7l9 4 9-4" />
    <path d="M12 11v10" />
    <path d="M5 10v3M19 10v3" />
  </Svg>
);

export const LockIcon = ({ size = 24 }) => (
  <Svg size={size}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
);
