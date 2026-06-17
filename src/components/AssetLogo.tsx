import React from "react";
import { TeslaIcon } from "./TeslaLogo";

interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * Authentic Orange Bitcoin Logo SVG Component
 */
export function BitcoinLogo({ className = "w-6 h-6" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <circle cx="32" cy="32" r="32" fill="#F7931A" />
      <path
        d="M45.5,27 c0.8-5.3-3.2-8.2-8.7-10.1l1.5-6.2L34.5,9.8l-1.5,6.1c-1,0-2-0.5-3-0.8V9H26v6c-1.3,0-2.6,0.3-3.8,0.6L20.7,9l-3.8,1l1.5,6.1c-0.8,0.2-1.7,0.4-2.5,0.7l-4.2-1.1L10,19.5l3.4,0.9c1.9,0.5,2.8,1.8,2.7,3.5l-2.7,11c0.2,0,0.3,0.1,0.5,0.1c-0.2,0-0.3-0.1-0.5-0.1l-3.4,13.8l3.8,1c0.7,0.2,1.4,0.3,2,0.5L14,58.3l3.8,1l1.5-6c1,0.3,2,0.5,3,0.8L20.8,60h3.8l-1.5-6.1c1.3,0,2.6-0.3,3.8-0.6l1.5,6.1l3.8-1l-1.5-6.1c6.5,1.2,11.4-0.1,13.5-5.2c1.7-4.1,0-6.5-2.9-8C40.6,32.3,43.2,30.4,45.5,27z M36.3,42.5c-1.2,4.8-9.4,2.2-12.1,1.5l2.2-8.7C29.1,36,37.5,37.6,36.3,42.5z M38.4,28.6c-1.1,4.4-7.9,2.2-10.1,1.6l2-8C32.4,22.8,39.5,24.3,38.4,28.6z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * Authentic Solana Gradient Diagonal Bars SVG Component
 */
export function SolanaLogo({ className = "w-6 h-6" }: LogoProps) {
  const gradientId = "solana-grad-" + Math.random().toString(36).substring(2, 9);
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14F195" />
          <stop offset="50%" stopColor="#80FFA2" />
          <stop offset="100%" stopColor="#9945FF" />
        </linearGradient>
      </defs>
      <g transform="translate(10, 10) scale(0.8)">
        {/* Three stacked stylized oblique parallelograms, perfectly rendered */}
        <path d="M 15 65 L 85 65 L 70 80 L 0 80 Z" fill={`url(#${gradientId})`} />
        <path d="M 70 20 L 0 20 L 15 5 L 85 5 Z" fill={`url(#${gradientId})`} />
        <path d="M 15 42.5 L 85 42.5 L 70 57.5 L 0 57.5 Z" fill={`url(#${gradientId})`} />
      </g>
    </svg>
  );
}

/**
 * High-fidelity SpaceX Orbital Swoop SVG Component
 */
export function SpaceXLogo({ className = "w-6 h-6" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Background container representing SpaceX startech theme */}
      <rect width="100" height="100" rx="20" fill="#030408" stroke="#1f243d" strokeWidth="1.5" />
      <g transform="translate(10, 10) scale(0.8)">
        {/* Geometric representation of SpaceX's futuristic "X" logo */}
        <path
          d="M 22 25 L 43 51 L 20 80 H 33 L 50 56 L 68 80 H 81 L 57 48 L 78 21 H 65 L 50 41 L 35 21 Z"
          fill="#FFFFFF"
        />
        {/* Authentic orbital ascent trajectory swooping arc */}
        <path
          d="M 18 80 C 40 55, 65 42, 92 14 H 78 C 55 35, 33 52, 18 80 Z"
          fill="#e82127"
        />
      </g>
    </svg>
  );
}

/**
 * High-fidelity Nvidia Green Spiral Eye SVG Component
 */
export function NvidiaLogo({ className = "w-6 h-6" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Dark Nvidia-themed background container */}
      <rect width="100" height="100" rx="20" fill="#040906" stroke="#10b981/15" strokeWidth="1.5" />
      <g transform="translate(12, 12) scale(0.76)">
        {/* Nvidia outer spiral */}
        <path
          d="M 50 10 C 27.9 10, 10 27.9, 10 50 C 10 72.1, 27.9 90, 50 90 C 72.1 90, 90 72.1, 90 50 L 76 50 C 76 64.4, 64.4 76, 50 76 C 35.6 76, 24 64.4, 24 50 C 24 35.6, 35.6 24, 50 24 L 50 10 Z"
          fill="#76B900"
        />
        {/* Nvidia inner spiral */}
        <path
          d="M 50 34 C 41.2 34, 34 41.2, 34 50 C 34 58.8, 41.2 66, 50 66 C 58.8 66, 66 58.8, 66 50 L 58 50 C 58 54.4, 54.4 58, 50 58 C 45.6 58, 42 54.4, 42 50 C 42 45.6, 45.6 42, 50 42 L 50 34 Z"
          fill="#76B900"
        />
        {/* Inner white eye pupil/core accent */}
        <path
          d="M 50 50 A 6 6 0 1 0 50 50.1 Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}

/**
 * Authentic Glowing Tesla Coin Cryptocurrency Token SVG Component
 */
export function TeslaCoinLogo({ className = "w-6 h-6" }: LogoProps) {
  const gradientId = "coin-metal-grad-" + Math.random().toString(36).substring(2, 9);
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        {/* Stunning crypto coin radial and metallic gradients */}
        <radialGradient id={`${gradientId}-bg`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff3b42" />
          <stop offset="70%" stopColor="#9e0c12" />
          <stop offset="100%" stopColor="#3d0305" />
        </radialGradient>
        <linearGradient id={`${gradientId}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="100%" stopColor="#F5A623" />
        </linearGradient>
      </defs>
      {/* Outer coin border ring */}
      <circle cx="50" cy="50" r="48" fill={`url(#${gradientId}-bg)`} stroke={`url(#${gradientId}-gold)`} strokeWidth="3" />
      <circle cx="50" cy="50" r="44" stroke="#ff3b42/40" strokeWidth="1" strokeDasharray="4,4" />
      {/* Inner physical coin ridges */}
      <circle cx="50" cy="50" r="41" stroke="#000000" strokeWidth="1.5" opacity="0.4" />
      {/* Beautifully integrated white vector Tesla T logo in the center */}
      <g transform="translate(15, 12) scale(0.7)">
        {/* T emblem top arc */}
        <path d="M 50 12 C 37.8 12.0 25.5 13.5 14.1 16.5 C 13.9 16.6 13.7 16.8 13.6 17.0 C 13.3 17.6 13.5 18.3 14.1 18.6 L 22.8 22.4 C 23.3 22.6 23.9 22.4 24.2 21.9 C 32.1 19.8 40.2 18.8 50.0 18.8 C 59.8 18.8 67.9 19.8 75.8 21.9 C 76.1 22.4 76.7 22.6 77.2 22.4 L 85.9 18.6 C 86.5 18.3 86.7 17.6 86.4 17.0 C 86.3 16.8 86.1 16.6 85.9 16.5 C 74.5 13.5 62.2 12.0 50 12.0 Z" fill="#FFFFFF" />
        {/* T emblem main body & stem */}
        <path d="M 50 22.5 C 47.9 22.5 45.8 22.6 43.8 22.8 C 43.3 22.9 42.9 23.2 42.8 23.7 L 40.0 42.0 C 39.8 42.8 40.5 43.5 41.3 43.5 C 43.1 43.3 45.0 43.2 47.0 43.1 L 47.0 74.2 C 47.0 76.0 48.1 77.6 49.7 78.0 L 50.0 78.1 L 50.3 78.0 C 51.9 77.6 53.0 76.0 53.0 74.2 L 53.0 43.1 C 55.0 43.2 56.9 43.3 58.7 43.5 C 59.5 43.5 60.2 42.8 60.0 42.0 L 57.2 23.7 C 57.1 23.2 56.7 22.9 56.2 22.8 C 54.2 22.6 52.1 22.5 50.0 22.5 Z M 16.9 24.6 C 16.4 25.1 16.5 26.0 17.1 26.3 C 24.4 30.6 30.6 36.4 35.3 43.3 C 35.8 43.9 36.6 43.9 37.1 43.4 L 41.7 38.8 C 42.1 38.4 42.1 37.7 41.7 37.2 C 37.0 30.3 30.7 24.6 23.4 20.3 C 22.8 20.0 22.0 20.3 21.7 20.9 L 16.9 24.6 Z M 83.1 24.6 L 78.3 20.9 C 78.0 20.3 77.2 20.0 76.6 20.3 C 69.3 24.6 63.0 30.3 58.3 37.2 C 57.9 37.7 57.9 38.4 58.3 38.8 L 62.9 43.4 C 63.4 43.9 64.2 43.9 64.7 43.3 C 69.4 36.4 75.6 30.6 82.9 26.3 C 83.5 26.0 83.6 25.1 83.1 24.6 Z" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

/**
 * Authentic Red Tesla Stock T Emblem Logo SVG Component
 */
export function TeslaStockLogo({ className = "w-6 h-6" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <rect width="100" height="100" rx="20" fill="#090a0f" stroke="#1f243d" strokeWidth="1.5" />
      <g transform="translate(15, 15) scale(0.7)">
        <TeslaIcon className="w-full h-full" color="#e82127" />
      </g>
    </svg>
  );
}

interface AssetLogoSelectorProps {
  symbol: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * Main Dynamic Asset Logo Switcher
 * Automatically resolves and displays authentic vector SVGs
 * for TSLA, TSLC, BTC, NVDA, SOL, SPACEX, and STX (Stacks).
 */
export default function AssetLogo({ symbol, className = "w-6 h-6", size }: AssetLogoSelectorProps) {
  const normSymbol = symbol.toUpperCase().trim();

  // Pick sizes
  let sizeClass = className;
  if (size === "xs") sizeClass = "w-4 h-4";
  else if (size === "sm") sizeClass = "w-6 h-6";
  else if (size === "md") sizeClass = "w-8 h-8";
  else if (size === "lg") sizeClass = "w-10 h-10";
  else if (size === "xl") sizeClass = "w-14 h-14";

  switch (normSymbol) {
    case "TSLA":
      return <TeslaStockLogo className={sizeClass} />;
    case "TSLC":
      return <TeslaCoinLogo className={sizeClass} />;
    case "BTC":
      return <BitcoinLogo className={sizeClass} />;
    case "SOL":
      return <SolanaLogo className={sizeClass} />;
    case "SPACEX":
      return <SpaceXLogo className={sizeClass} />;
    case "NVDA":
      return <NvidiaLogo className={sizeClass} />;
    case "STX":
      // Stacks (STX) is the layer-2 protocol for Bitcoin, let's render a gorgeous purple-gradient circular coin
      return (
        <svg viewBox="0 0 100 100" className={sizeClass} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#5546FF" stroke="#a78bfa" strokeWidth="2.5" />
          {/* Stacks overlapping block geometric logo */}
          <path d="M35 32 H65 V44 H35 Z" fill="#FFFFFF" />
          <path d="M35 48 H65 V60 H35 Z" fill="#FFFFFF" />
          <path d="M35 64 H65 V68 H35 Z" fill="#FFFFFF" opacity="0.6" />
        </svg>
      );
    default:
      // Fallback: Generic styled token placeholder
      return (
        <div className={`${sizeClass} flex items-center justify-center rounded-lg bg-[#e82127]/10 border border-[#e82127]/30 text-white font-mono text-[9px] font-extrabold uppercase`}>
          {normSymbol.slice(0, 3)}
        </div>
      );
  }
}
