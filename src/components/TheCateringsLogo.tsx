import React from 'react';

interface TheCateringsLogoProps {
  className?: string;
  style?: React.CSSProperties;
  imgClassName?: string;
  variant?: 'transparent' | 'amber' | 'classic' | 'vector';
  showContainer?: boolean;
}

export function TheCateringsLogo({
  className = 'h-14 w-auto',
  style,
  imgClassName = 'h-full w-auto object-contain',
  showContainer = false,
}: TheCateringsLogoProps) {
  const newLogoPath = '/the_caterings_logo.png';

  const content = (
    <img 
      src={newLogoPath} 
      alt="The Catering Logo" 
      className={`w-full max-w-[280px] sm:max-w-[340px] h-auto object-contain ${imgClassName}`}
      onError={(e) => {
        // Fallback to classic if main png fails
        (e.target as HTMLImageElement).src = '/the_caterings_logo_classic.png';
      }}
    />
  );

  if (!showContainer) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 select-none bg-transparent ${className}`}
        style={style}
        title="The Catering — Operations Portal"
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none bg-transparent transition-all duration-200 ${className}`}
      style={style}
      title="The Catering — Operations Portal"
    >
      {content}
    </div>
  );
}

export default TheCateringsLogo;
