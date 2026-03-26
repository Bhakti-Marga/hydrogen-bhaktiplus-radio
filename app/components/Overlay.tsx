import { type ReactNode } from 'react';

interface OverlayProps {
  isVisible?: boolean;
  onClick?: () => void;
  opacity?: 'light' | 'medium' | 'dark';
  className?: string;
  children?: ReactNode;
  variant?: 'fixed' | 'absolute';
}

export function Overlay({
  isVisible = true,
  onClick,
  opacity = 'medium',
  className = '',
  children,
  variant = 'fixed',
}: OverlayProps) {
  if (!isVisible) return null;

  const opacityClasses = {
    light: 'bg-black/30',
    medium: 'bg-black/50',
    dark: 'bg-black/70',
  };

  const positionClass = variant === 'fixed' ? 'fixed' : 'absolute';

  return (
    <div
      className={`${positionClass} inset-0 z-40 ${opacityClasses[opacity]} ${className}`}
      onClick={onClick}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
