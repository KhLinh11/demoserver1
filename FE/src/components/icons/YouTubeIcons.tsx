import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * YouTube-style Home icon (clean geometric outline house)
 */
export function YtHomeIcon({ className = "w-5 h-5", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
    >
      <path d="M12 3.879l7.707 6.166-.624.78L12 5.121l-7.083 5.704-.624-.78L12 3.879zM4 11.121v9.379h6v-6h4v6h6v-9.379l-8-6.4-8 6.4zm15 8.379h-4v-6H9v6H5v-7.879l7-5.6 7 5.6v7.879z" />
    </svg>
  );
}

/**
 * YouTube-style Upload icon (Cloud arrow up / Upload video)
 */
export function YtUploadIcon({ className = "w-5 h-5", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
    >
      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
      <path d="M16 8l-4-4-4 4" />
      <path d="M12 4v12" />
    </svg>
  );
}

/**
 * YouTube-style Analytics / Trending icon (Studio bar chart)
 */
export function YtAnalyticsIcon({ className = "w-5 h-5", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
    >
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
    </svg>
  );
}

/**
 * YouTube-style Todo / Checklist / Playlist icon
 */
export function YtTodoListIcon({ className = "w-5 h-5", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

/**
 * YouTube-style AI Assistant / Create Sparkles Bot icon
 */
export function YtBotIcon({ className = "w-5 h-5", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
    >
      <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" />
    </svg>
  );
}

/**
 * YouTube-style Bell Notification icon
 */
export function YtBellIcon({ className = "w-5 h-5", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

/**
 * YouTube-style Settings / Equalizer Sliders icon
 */
export function YtSlidersIcon({ className = "w-5 h-5", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

/**
 * YouTube-style Document / Report icon
 */
export function YtReportIcon({ className = "w-5 h-5", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

/**
 * YouTube-style User / Profile icon
 */
export function YtUserIcon({ className = "w-5 h-5", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/**
 * YouTube-style Save / Floppy Disk icon
 */
export function YtSaveIcon({ className = "w-5 h-5", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
    >
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

/**
 * YouTube-style Add Plus in Box icon
 */
export function YtPlusIcon({ className = "w-5 h-5", size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

/**
 * Red Close X Circle icon (matching the screenshot cards top-right)
 */
export function RedCloseBadge({ onClick, title = "Xóa thẻ" }: { onClick?: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-6 h-6 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white flex items-center justify-center text-xs font-black shadow-xs transition transform hover:scale-110 active:scale-95 cursor-pointer"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3.5 h-3.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

/**
 * Cute Mascot Character (matching the owl mascot in the user screenshot)
 */
export function CuteOwlMascot({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      {/* Body */}
      <ellipse cx="50" cy="54" rx="36" ry="38" fill="#F98B68" />
      {/* Belly */}
      <ellipse cx="50" cy="62" rx="24" ry="24" fill="#FEE9DF" />
      {/* Wings */}
      <ellipse cx="18" cy="56" rx="9" ry="18" fill="#E86E4A" transform="rotate(-12 18 56)" />
      <ellipse cx="82" cy="56" rx="9" ry="18" fill="#E86E4A" transform="rotate(12 82 56)" />
      {/* Ear tufts */}
      <polygon points="26,24 38,36 22,38" fill="#E86E4A" />
      <polygon points="74,24 62,36 78,38" fill="#E86E4A" />
      {/* Big Eyes White */}
      <circle cx="36" cy="44" r="13" fill="#FFFFFF" />
      <circle cx="64" cy="44" r="13" fill="#FFFFFF" />
      {/* Eyes Pupils */}
      <circle cx="37" cy="44" r="7" fill="#2C3E3A" />
      <circle cx="63" cy="44" r="7" fill="#2C3E3A" />
      {/* Catchlights */}
      <circle cx="35" cy="42" r="2.5" fill="#FFFFFF" />
      <circle cx="61" cy="42" r="2.5" fill="#FFFFFF" />
      {/* Cute Beak */}
      <polygon points="50,49 44,57 56,57" fill="#F8A528" />
      {/* Cute Blush */}
      <circle cx="23" cy="53" r="5" fill="#F67E60" opacity="0.6" />
      <circle cx="77" cy="53" r="5" fill="#F67E60" opacity="0.6" />
      {/* Feet */}
      <ellipse cx="40" cy="90" rx="6" ry="3.5" fill="#F8A528" />
      <ellipse cx="60" cy="90" rx="6" ry="3.5" fill="#F8A528" />
    </svg>
  );
}
