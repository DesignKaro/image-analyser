import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

type BaseIconProps = IconProps & {
  children: ReactNode;
};

function BaseIcon({ children, ...props }: BaseIconProps) {
  return (
    <svg
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
}

export function BrandMarkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 2 22 7.5 12 13 2 7.5 12 2Z" fill="currentColor" />
      <path d="M12 14 22 8.5V11L12 16.5 2 11V8.5L12 14Z" fill="currentColor" opacity="0.48" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="m5.64 5.64 2.82 2.82" />
      <path d="m15.54 15.54 2.82 2.82" />
      <path d="m18.36 5.64-2.82 2.82" />
      <path d="m8.46 15.54-2.82 2.82" />
      <circle cx="12" cy="12" r="2.2" />
    </BaseIcon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 16V5" />
      <path d="m7.5 9.5 4.5-4.5 4.5 4.5" />
      <path d="M4 18.5a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5" />
    </BaseIcon>
  );
}

export function WandIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m4 20 9.5-9.5" />
      <path d="m10.5 4.5 1 1" />
      <path d="m14 2.5.5 1.5" />
      <path d="m16 6 1.5.5" />
      <path d="m17.5 10.5 1 1" />
      <rect x="12.4" y="9.6" width="7.5" height="3" rx="1.5" transform="rotate(45 12.4 9.6)" />
    </BaseIcon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2" />
    </BaseIcon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </BaseIcon>
  );
}

export function SaveIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </BaseIcon>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.59 13.51 6.82 3.98" />
      <path d="m15.41 6.51-6.82 3.98" />
    </BaseIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m5 12 4 4 10-10" />
    </BaseIcon>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8 6 4-6 4Z" />
    </BaseIcon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </BaseIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </BaseIcon>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.63v3.01h3.87c2.26-2.08 3.56-5.15 3.56-8.67Z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3.01c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.11A12 12 0 0 0 12 24Z"
        fill="#34A853"
      />
      <path
        d="M5.29 14.27A7.2 7.2 0 0 1 4.93 12c0-.79.14-1.55.36-2.27V6.62H1.29A12 12 0 0 0 0 12c0 1.93.46 3.76 1.29 5.38l4-3.11Z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.78c1.76 0 3.33.61 4.57 1.8l3.43-3.43C17.95 1.2 15.24 0 12 0 7.29 0 3.22 2.69 1.29 6.62l4 3.11c.94-2.84 3.59-4.95 6.71-4.95Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function ChromeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 20.1 12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 7.5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m21 16-4.7-4.7a2.2 2.2 0 0 0-3.1 0L8 16" />
    </BaseIcon>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </BaseIcon>
  );
}

export function ServerIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="18" height="6" rx="2" />
      <path d="M7 7h.01" />
      <path d="M7 17h.01" />
    </BaseIcon>
  );
}

export function PuzzleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M13 4h3a2 2 0 0 1 2 2v3h-2a2 2 0 1 0 0 4h2v3a2 2 0 0 1-2 2h-3v-2a2 2 0 1 0-4 0v2H6a2 2 0 0 1-2-2v-3h2a2 2 0 1 0 0-4H4V6a2 2 0 0 1 2-2h3v2a2 2 0 1 0 4 0V4Z" />
    </BaseIcon>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 10 11 19 3 11V4h7Z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </BaseIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </BaseIcon>
  );
}

export function PenIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 21h4l11-11a2.2 2.2 0 0 0-3.1-3.1L4 18v3Z" />
      <path d="m13.8 7.2 3 3" />
    </BaseIcon>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
      <path d="M9 9h2" />
    </BaseIcon>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m12 3 8 4.5-8 4.5-8-4.5 8-4.5Z" />
      <path d="M4 8v8.5L12 21l8-4.5V8" />
      <path d="M12 12v9" />
    </BaseIcon>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V6l7-3v18" />
      <path d="M12 21V9l7-2v14" />
      <path d="M8 9h.01" />
      <path d="M8 13h.01" />
      <path d="M15 12h.01" />
      <path d="M15 16h.01" />
    </BaseIcon>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </BaseIcon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18" />
      <path d="M12 3a15 15 0 0 0 0 18" />
    </BaseIcon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3 5 6v6c0 5 3 8 7 9 4-1 7-4 7-9V6Z" />
      <path d="m9 12 2 2 4-4" />
    </BaseIcon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v12" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4 19h16" />
    </BaseIcon>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </BaseIcon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 9 6 6 6-6" />
    </BaseIcon>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 15 6-6 6 6" />
    </BaseIcon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m15 18-6-6 6-6" />
    </BaseIcon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m9 18 6-6-6-6" />
    </BaseIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </BaseIcon>
  );
}
