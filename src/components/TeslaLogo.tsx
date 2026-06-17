import React from "react";

/**
 * High-fidelity, scalable SVG component representing the official Tesla T emblem.
 */
export function TeslaIcon({ className = "w-10 h-10", color = "#e82127" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      id="svg-tesla-icon"
    >
      {/* T emblem top arc */}
      <path d="M 50 12 C 37.8 12.0 25.5 13.5 14.1 16.5 C 13.9 16.6 13.7 16.8 13.6 17.0 C 13.3 17.6 13.5 18.3 14.1 18.6 L 22.8 22.4 C 23.3 22.6 23.9 22.4 24.2 21.9 C 32.1 19.8 40.2 18.8 50.0 18.8 C 59.8 18.8 67.9 19.8 75.8 21.9 C 76.1 22.4 76.7 22.6 77.2 22.4 L 85.9 18.6 C 86.5 18.3 86.7 17.6 86.4 17.0 C 86.3 16.8 86.1 16.6 85.9 16.5 C 74.5 13.5 62.2 12.0 50 12.0 Z" />
      {/* T emblem main body & stem */}
      <path d="M 50 22.5 C 47.9 22.5 45.8 22.6 43.8 22.8 C 43.3 22.9 42.9 23.2 42.8 23.7 L 40.0 42.0 C 39.8 42.8 40.5 43.5 41.3 43.5 C 43.1 43.3 45.0 43.2 47.0 43.1 L 47.0 74.2 C 47.0 76.0 48.1 77.6 49.7 78.0 L 50.0 78.1 L 50.3 78.0 C 51.9 77.6 53.0 76.0 53.0 74.2 L 53.0 43.1 C 55.0 43.2 56.9 43.3 58.7 43.5 C 59.5 43.5 60.2 42.8 60.0 42.0 L 57.2 23.7 C 57.1 23.2 56.7 22.9 56.2 22.8 C 54.2 22.6 52.1 22.5 50.0 22.5 Z M 16.9 24.6 C 16.4 25.1 16.5 26.0 17.1 26.3 C 24.4 30.6 30.6 36.4 35.3 43.3 C 35.8 43.9 36.6 43.9 37.1 43.4 L 41.7 38.8 C 42.1 38.4 42.1 37.7 41.7 37.2 C 37.0 30.3 30.7 24.6 23.4 20.3 C 22.8 20.0 22.0 20.3 21.7 20.9 L 16.9 24.6 Z M 83.1 24.6 L 78.3 20.9 C 78.0 20.3 77.2 20.0 76.6 20.3 C 69.3 24.6 63.0 30.3 58.3 37.2 C 57.9 37.7 57.9 38.4 58.3 38.8 L 62.9 43.4 C 63.4 43.9 64.2 43.9 64.7 43.3 C 69.4 36.4 75.6 30.6 82.9 26.3 C 83.5 26.0 83.6 25.1 83.1 24.6 Z" />
    </svg>
  );
}

/**
 * Premium, vector-drawn representation of the official stylized "TESLA" wordmark logo.
 * Renders precisely the high-fidelity cyberpunk font contours from the logo attachment.
 */
export function TeslaWordmark({ className = "h-5", color = "#e82127" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 450 60"
      className={className}
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      id="svg-tesla-wordmark"
    >
      {/* T */}
      <path d="M 12 15 C 28 12.5 44 11 60 11 C 76 11 92 12.5 108 15 C 108 15 95 18 80 19 L 80 43 C 80 47 75 49 60 49 C 45 49 40 47 40 43 L 40 19 C 25 18 12 15 12 15 Z M 48 21 L 48 41 C 48 42.5 52 43 60 43 C 68 43 72 42.5 72 41 L 72 21 C 64 21 56 21 48 21 Z" />
      
      {/* E */}
      <path d="M 125 14 C 145 13 165 13 185 14 M 125 28 C 143 27 161 27 179 28 M 125 42 C 145 42.5 165 43.5 185 45" stroke={color} strokeWidth="10" strokeLinecap="butt" strokeLinejoin="miter" fill="none" />
      
      {/* S */}
      <path d="M 210 15 C 230 13 250 13 270 15 C 270 15 258 18 240 19 L 210 21 Q 208 28 220 29 M 220 29 C 235 29 255 28.5 270 29 C 270 29 255 32 235 33 L 210 34 M 210 34 Q 212 41 225 42 C 240 43 255 43.5 270 45 C 270 45 258 48 240 49 Q 220 49.5 210 47" stroke={color} strokeWidth="9" strokeLinecap="square" fill="none" />
      
      {/* L */}
      <path d="M 300 11 L 300 45 Q 300 49 315 49 L 350 49 C 350 49 335 44 315 43 L 315 11 Z" />
      
      {/* A */}
      <path d="M 380 45 L 405 11 L 430 45 M 392 31 L 418 31" stroke={color} strokeWidth="9" strokeLinecap="square" fill="none" />
    </svg>
  );
}
