import React from 'react';

export interface RoseLogoProps {
  size?: number; // Target height in px (aspect ratio 64:96 -> 2:3)
  color?: string; // Stroke color, defaults to 'currentColor'
  strokeScale?: number;
  glow?: boolean;
  animate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function RoseLogo({
  size = 28,
  color = 'currentColor',
  strokeScale = 1.0,
  glow = false,
  animate = false,
  className = '',
  style = {}
}: RoseLogoProps) {
  const width = Math.round((size * 64) / 96);

  return (
    <svg
      width={width}
      height={size}
      viewBox="-32 -48 64 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rose-vector-logo ${glow ? 'has-glow' : ''} ${animate ? 'animated-bloom' : ''} ${className}`}
      style={style}
      aria-label="Roselle Rose Emblem"
    >
      <g
        transform="translate(0, -3)"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
      >
        {/* Layer 1: Outer Petal Silhouette (1.65px base) */}
        <path
          className="rose-layer rose-layer-outer"
          strokeWidth={1.65 * strokeScale}
          d="M -17 -9 C -25 -19 -17 -30 -8 -28 C -2 -37 10 -33 13 -26 C 24 -27 28 -15 20 -8 C 20 3 8 10 0 10 C -11 9 -18 2 -17 -9 Z"
        />
        {/* Layer 2: Petal Architecture (1.45px base) */}
        <path
          className="rose-layer rose-layer-petals"
          strokeWidth={1.45 * strokeScale}
          d="M -17 -9 C -8 -9 -4 2 0 10 M 20 -8 C 10 -9 5 2 0 10 M -17 -21 C -18 -11 -10 -3 -3 0 M 22 -19 C 21 -10 13 -4 7 0"
        />
        {/* Layer 3: Central Core Heart (1.45px base) */}
        <path
          className="rose-layer rose-layer-heart"
          strokeWidth={1.45 * strokeScale}
          d="M -8 -28 C -11 -18 -3 -10 5 -9 M 13 -26 C 5 -29 -5 -23 -5 -17 C -3 -10 9 -10 11 -17 C 13 -23 3 -25 0 -20 C -2 -16 4 -14 6 -18"
        />
        {/* Layer 4: Thorned Stem (1.35px base) */}
        <path
          className="rose-layer rose-layer-stem"
          strokeWidth={1.35 * strokeScale}
          d="M 0 10 C -4 21 4 32 0 43 M 0 29 C -11 29 -17 23 -18 18 C -8 17 -2 20 0 29 M 1 35 C 10 34 17 27 17 22 C 8 23 2 27 1 35"
        />
      </g>
    </svg>
  );
}
