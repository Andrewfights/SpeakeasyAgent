import React from 'react';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getScoreTier(score: number): string {
  if (score >= 90) return 'tier-1';
  if (score >= 75) return 'tier-2';
  if (score >= 60) return 'tier-3';
  return 'tier-4';
}

export function ScoreBadge({ score, size = 'md', className = '' }: ScoreBadgeProps) {
  const tier = getScoreTier(score);

  const sizeClasses = {
    sm: 'text-[9.5px] min-w-[24px] px-1.5 py-0.5 rounded-[7px]',
    md: 'text-[10.5px] min-w-[28px] px-2 py-0.5 rounded-[9px]',
    lg: 'text-[11.5px] min-w-[32px] px-2.5 py-1 rounded-[10px]'
  };

  return (
    <span className={`score-badge ${tier} ${sizeClasses[size]} ${className}`}>
      {score}
    </span>
  );
}

// Score gauge component for analyzer
interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreGauge({ score, size = 72, strokeWidth = 5, className = '' }: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  const getColor = () => {
    if (score >= 75) return '#fbbf24'; // gold
    if (score >= 60) return '#a8a29e'; // muted
    return '#d85a30'; // rust
  };

  const getLabel = () => {
    if (score >= 90) return 'Great deal';
    if (score >= 75) return 'Consider';
    if (score >= 60) return 'Maybe';
    return 'Skip';
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2a231d"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
      </svg>
      <div>
        <div
          className="text-[28px] font-medium tabular-nums leading-none"
          style={{ color: getColor(), fontFamily: 'var(--font-display)' }}
        >
          {score}
        </div>
        <div
          className="text-[10.5px] uppercase tracking-[0.14em] mt-1"
          style={{ color: getColor(), fontFamily: 'var(--font-display)' }}
        >
          {getLabel()}
        </div>
      </div>
    </div>
  );
}

export default ScoreBadge;
