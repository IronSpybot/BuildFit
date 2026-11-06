import React from 'react';
import { Flame } from 'lucide-react';

interface ConcentricFitnessRingsProps {
  proteinRatio: number;
  carbsRatio: number;
  fatRatio: number;
  size?: number;
}

export const ConcentricFitnessRings: React.FC<ConcentricFitnessRingsProps> = ({
  proteinRatio,
  carbsRatio,
  fatRatio,
  size = 150,
}) => {
  const strokeWidth = 11;
  const gap = 14;

  // Outer: Protein (r = 60)
  const rProtein = 60;
  const cProtein = 2 * Math.PI * rProtein;
  const pOffset = cProtein * (1 - Math.min(1, Math.max(0, proteinRatio)));

  // Middle: Carbs (r = 46)
  const rCarbs = rProtein - gap;
  const cCarbs = 2 * Math.PI * rCarbs;
  const cOffset = cCarbs * (1 - Math.min(1, Math.max(0, carbsRatio)));

  // Inner: Fats (r = 32)
  const rFats = rCarbs - gap;
  const cFats = 2 * Math.PI * rFats;
  const fOffset = cFats * (1 - Math.min(1, Math.max(0, fatRatio)));

  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <defs>
          {/* Neon Gradients */}
          <linearGradient id="proteinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#30D158" />
            <stop offset="100%" stopColor="#248A3D" />
          </linearGradient>
          <linearGradient id="carbsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64D2FF" />
            <stop offset="100%" stopColor="#0A84FF" />
          </linearGradient>
          <linearGradient id="fatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BF5AF2" />
            <stop offset="100%" stopColor="#5E5CE6" />
          </linearGradient>
        </defs>

        {/* Track 1: Protein Background Track */}
        <circle
          cx={center}
          cy={center}
          r={rProtein}
          fill="none"
          stroke="#30D158"
          strokeOpacity={0.15}
          strokeWidth={strokeWidth}
        />
        {/* Track 2: Carbs Background Track */}
        <circle
          cx={center}
          cy={center}
          r={rCarbs}
          fill="none"
          stroke="#64D2FF"
          strokeOpacity={0.15}
          strokeWidth={strokeWidth}
        />
        {/* Track 3: Fat Background Track */}
        <circle
          cx={center}
          cy={center}
          r={rFats}
          fill="none"
          stroke="#BF5AF2"
          strokeOpacity={0.15}
          strokeWidth={strokeWidth}
        />

        {/* Active Ring 1: Protein (Neon Green) */}
        <circle
          cx={center}
          cy={center}
          r={rProtein}
          fill="none"
          stroke="url(#proteinGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={cProtein}
          strokeDashoffset={pOffset}
          className="transition-all duration-700 ease-out filter drop-shadow-[0_0_6px_rgba(48,209,88,0.5)]"
        />

        {/* Active Ring 2: Carbs (Cyan) */}
        <circle
          cx={center}
          cy={center}
          r={rCarbs}
          fill="none"
          stroke="url(#carbsGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={cCarbs}
          strokeDashoffset={cOffset}
          className="transition-all duration-700 ease-out filter drop-shadow-[0_0_6px_rgba(100,210,255,0.5)]"
        />

        {/* Active Ring 3: Fats (Purple) */}
        <circle
          cx={center}
          cy={center}
          r={rFats}
          fill="none"
          stroke="url(#fatGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={cFats}
          strokeDashoffset={fOffset}
          className="transition-all duration-700 ease-out filter drop-shadow-[0_0_6px_rgba(191,90,242,0.5)]"
        />
      </svg>

      {/* Center Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Flame className="w-5 h-5 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)] animate-pulse" />
      </div>
    </div>
  );
};
