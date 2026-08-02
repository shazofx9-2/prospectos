import React, { useId } from 'react';

interface ProspectOSLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export default function ProspectOSLogo({
  className = "w-7 h-7",
  showText = false,
  textClassName = "text-sm font-black text-white uppercase tracking-wider"
}: ProspectOSLogoProps) {
  const maskId = useId();

  return (
    <div className="flex items-center gap-2.5 inline-flex select-none">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} shrink-0`}
      >
        {/* Dark background container */}
        <rect width="100" height="100" rx="22" fill="#000000" />
        <rect
          x="0.75"
          y="0.75"
          width="98.5"
          height="98.5"
          rx="21.25"
          stroke="#FFFFFF"
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />

        <g>
          <mask id={maskId}>
            <rect width="100" height="100" fill="white" />
            <polygon points="20,73.5 28,75.5 48,51.5 40,49.5" fill="black" />
            <line
              x1="18"
              y1="73"
              x2="49"
              y2="48"
              stroke="black"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </mask>

          {/* Solid White P emblem */}
          <path
            mask={`url(#${maskId})`}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M33.5 24C33.5 22.3431 34.8431 21 36.5 21H57C68.0457 21 77 29.9543 77 41C77 52.0457 68.0457 61 57 61H42.5V73.5C42.5 75.1569 41.1569 76.5 39.5 76.5H36.5C34.8431 76.5 33.5 75.1569 33.5 73.5V24ZM42.5 31V51H57C62.5228 51 67 46.5228 67 41C67 35.4772 62.5228 31 57 31H42.5Z"
            fill="#FFFFFF"
          />

          {/* Sharp diagonal slash extension at bottom-left */}
          <path d="M25 71.5L33.5 62V66.5L28 73Z" fill="#FFFFFF" />
        </g>
      </svg>
      {showText && <span className={textClassName}>ProspectOS</span>}
    </div>
  );
}
