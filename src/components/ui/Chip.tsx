import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'gold';
  className?: string;
}

export function Chip({ children, variant = 'default', className = '' }: ChipProps) {
  return (
    <span className={`chip ${variant === 'gold' ? 'gold' : ''} ${className}`}>
      {children}
    </span>
  );
}

interface ChipDotProps {
  status?: 'active' | 'warn' | 'idle';
  className?: string;
}

export function ChipDot({ status = 'active', className = '' }: ChipDotProps) {
  const statusClass = status === 'warn' ? 'warn' : status === 'idle' ? 'idle' : '';
  return <span className={`chip-dot ${statusClass} ${className}`} />;
}

interface FilterPillProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FilterPill({ children, active = false, onClick, className = '' }: FilterPillProps) {
  return (
    <button
      className={`filter-pill ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Chip;
