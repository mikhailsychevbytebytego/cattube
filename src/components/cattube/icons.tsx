import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function HomeIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M12 3.2 3.2 10.2V21h6.2v-6.5h5.2V21h6.2V10.2L12 3.2Z" />
      </svg>
    );
  }

  return (
    <Icon {...props}>
      <path d="m4 11 8-7 8 7" />
      <path d="M6 10.5V20h12v-9.5" />
    </Icon>
  );
}

export function ShortsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.2 3.8h7.6c.9 0 1.5.9 1.2 1.8L15.2 12l1.8 6.4c.3.9-.3 1.8-1.2 1.8H8.2c-.9 0-1.5-.9-1.2-1.8L8.8 12 7 5.6c-.3-.9.3-1.8 1.2-1.8Z" />
      <path d="m11 9 4 3-4 3V9Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function SubscriptionsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 8h14v11H5V8Z" />
      <path d="M8 5h8" />
      <path d="M10 4h4" />
      <path d="m11 12 4 2.5-4 2.5V12Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function YourVideosIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="m10 10 5 2.5L10 15v-5Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.5" />
    </Icon>
  );
}

export function LikeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 11v9H4v-9h3Z" />
      <path d="M7 11 10.5 4h.8c1 0 1.7.9 1.5 1.9L12.2 9H19a2 2 0 0 1 2 2.3l-1 7A2 2 0 0 1 18 20H7" />
    </Icon>
  );
}

export function PlaylistIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h11M4 12h11M4 17h7" />
      <path d="m15 14 5 3-5 3v-6Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function FireIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3s2.5 3 2.5 5.5S13 12 13 12s4 0 4 4.5S14.5 21 12 21s-5-2-5-5.5 3.2-7.2 5-12.5Z" />
    </Icon>
  );
}

export function MusicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="2.5" />
      <circle cx="17" cy="16" r="2.5" />
    </Icon>
  );
}

export function LiveIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M6 6a8.5 8.5 0 0 0 0 12M18 6a8.5 8.5 0 0 1 0 12" />
    </Icon>
  );
}

export function GameIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 9h10a4 4 0 0 1 3.8 5.3l-.5 1.5A3 3 0 0 1 17.4 18h-1.6l-1.3-2H9.5L8.2 18H6.6a3 3 0 0 1-2.9-2.2l-.5-1.5A4 4 0 0 1 7 9Z" />
      <path d="M8.5 12.5h3M10 11v3" />
      <path d="M15.2 11.8h.1M16.8 13.4h.1" />
    </Icon>
  );
}

export function NewsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 6h11a3 3 0 0 1 3 3v9H8a3 3 0 0 1-3-3V6Z" />
      <path d="M8 10h8M8 14h5" />
    </Icon>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5h8v4a4 4 0 0 1-8 0V5Z" />
      <path d="M8 7H5.5a2.5 2.5 0 0 0 2.5 3M16 7h2.5A2.5 2.5 0 0 1 16 10" />
      <path d="M12 13v3M9 19h6M10 16h4v3h-4v-3Z" />
    </Icon>
  );
}

export function LearnIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10 12 6l8 4-8 4-8-4Z" />
      <path d="M8 12.5V16c1.5 1.2 3 1.8 4 1.8s2.5-.6 4-1.8v-3.5" />
    </Icon>
  );
}

export function HangerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 7a2 2 0 1 0-2 2c.6 0 1 .4 1 .9V11" />
      <path d="M4 18h16l-8-7-8 7Z" />
    </Icon>
  );
}

export function PanoramaIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 8c2.2-1.8 4.8-2.8 9-2.8S18.8 6.2 21 8v8c-2.2 1.8-4.8 2.8-9 2.8S5.2 17.8 3 16V8Z" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Icon>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5a2.8 2.8 0 0 0-2.8 2.8v5.4a2.8 2.8 0 0 0 5.6 0V6.3A2.8 2.8 0 0 0 12 3.5Z" />
      <path d="M6.2 11.2a5.8 5.8 0 0 0 11.6 0" />
      <path d="M12 17v3.4M9.2 20.4h5.6" />
    </Icon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 16h12l-1.2-2.2a6.5 6.5 0 0 1-.8-3.2V9a5 5 0 0 0-10 0v1.6c0 1.1-.3 2.2-.8 3.2L6 16Z" />
      <path d="M10 16a2 2 0 0 0 4 0" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

export function VerifiedIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.5 14.6 4l3 .5.5 3L20 10l-1.9 2.5.5 3-3 .5-2.6 1.5-2.6-1.5-3-.5.5-3L5.9 10l1.9-2.5.5-3 3-.5L12 2.5Zm-1.3 12.3 5.2-5.2-1.4-1.4-3.8 3.8-1.8-1.8-1.4 1.4 3.2 3.2Z" />
    </svg>
  );
}

export function PawIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <ellipse cx="7" cy="8" rx="2.1" ry="2.6" />
      <ellipse cx="12" cy="5.6" rx="2.1" ry="2.6" />
      <ellipse cx="17" cy="8" rx="2.1" ry="2.6" />
      <ellipse cx="5.6" cy="13.2" rx="1.9" ry="2.3" />
      <path d="M12 10.5c-3.4 0-5.8 2.4-5.8 5 0 2.2 1.8 3.4 3.6 3.4 1 0 1.5-.4 2.2-.4s1.2.4 2.2.4c1.8 0 3.6-1.2 3.6-3.4 0-2.6-2.4-5-5.8-5Z" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 5.5v13l11-6.5L8 5.5Z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6 5h4v14H6V5Zm8 0h4v14h-4V5Z" />
    </svg>
  );
}

export function VolumeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10h3.2L12 6.5v11L7.2 14H4v-4Z" fill="currentColor" stroke="none" />
      <path d="M15 9.2a4 4 0 0 1 0 5.6" />
    </Icon>
  );
}

export function ClosedCaptionsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M8 10.2c-.8 0-1.4.5-1.4 1.8s.6 1.8 1.4 1.8c.5 0 .9-.2 1.1-.6M16 10.2c-.8 0-1.4.5-1.4 1.8s.6 1.8 1.4 1.8c.5 0 .9-.2 1.1-.6" />
    </Icon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4.5v2.2M12 17.3V19.5M4.5 12h2.2M17.3 12H19.5M6.4 6.4l1.6 1.6M16 16l1.6 1.6M17.6 6.4 16 8M8 16l-1.6 1.6" />
    </Icon>
  );
}

export function TheaterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="7" width="18" height="10" rx="1.5" />
    </Icon>
  );
}

export function FullscreenIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4" />
    </Icon>
  );
}

export function DislikeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 13V4H4v9h3Z" />
      <path d="M7 13 10.5 20h.8c1 0 1.7-.9 1.5-1.9L12.2 15H19a2 2 0 0 0 2-2.3l-1-7A2 2 0 0 0 18 4H7" />
    </Icon>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="17" cy="6.5" r="2.2" />
      <circle cx="17" cy="17.5" r="2.2" />
      <path d="m8 11 7-3.5M8 13l7 3.5" />
    </Icon>
  );
}

export function ClipIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5h5l5 5v9H8V5Z" />
      <path d="M13 5v5h5" />
    </Icon>
  );
}

export function SaveIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 4.5h12v16l-6-3.5-6 3.5v-16Z" />
    </Icon>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16.5 13.2A6.4 6.4 0 0 1 10.8 4.8 7 7 0 1 0 19.2 13.2a6.3 6.3 0 0 1-2.7 0Z" />
    </Icon>
  );
}
