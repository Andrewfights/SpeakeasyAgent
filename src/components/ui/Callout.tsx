import React from 'react';

type CalloutType = 'note' | 'warn' | 'danger' | 'good';

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Callout({ type, title, children, className = '' }: CalloutProps) {
  return (
    <div className={`callout ${type} ${className}`}>
      {title && <b>{title}</b>} {children}
    </div>
  );
}

export default Callout;
