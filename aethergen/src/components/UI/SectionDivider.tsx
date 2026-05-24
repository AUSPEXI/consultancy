import React from 'react';

interface SectionDividerProps {
  variant?: 'wave' | 'curve' | 'geometric' | 'diagonal' | 'zigzag' | 'smooth';
  direction?: 'up' | 'down';
  className?: string;
  fillColor?: string;
}

const SectionDivider: React.FC<SectionDividerProps> = ({ 
  variant = 'wave', 
  direction = 'down',
  className = '',
  fillColor = 'currentColor'
}) => {
  const baseClasses = `w-full ${direction === 'down' ? 'rotate-180' : ''}`;
  
  const dividers = {
    wave: (
      <svg className={baseClasses} viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path 
          d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
          opacity=".25" 
          style={{ fill: fillColor }}
        />
        <path 
          d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
          opacity=".5" 
          style={{ fill: fillColor }}
        />
        <path 
          d="M0,0V5.63C149.93,59,314.9,53.44,475.83,36.29,614.17,20.22,750.67,9.58,884.84,4.36,1033.57-1.56,1190.19,5.36,1200,27.23V0Z" 
          style={{ fill: fillColor }}
        />
      </svg>
    ),
    
    curve: (
      <svg className={baseClasses} viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path 
          d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
          style={{ fill: fillColor }}
        />
      </svg>
    ),
    
    geometric: (
      <svg className={baseClasses} viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path 
          d="M0,0L50,60L100,30L150,90L200,0L250,60L300,30L350,90L400,0L450,60L500,30L550,90L600,0L650,60L700,30L750,90L800,0L850,60L900,30L950,90L1000,0L1050,60L1100,30L1150,90L1200,0V120H0Z" 
          style={{ fill: fillColor }}
        />
      </svg>
    ),
    
    diagonal: (
      <svg className={baseClasses} viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path 
          d="M0,0L1200,120V0Z" 
          style={{ fill: fillColor }}
        />
      </svg>
    ),
    
    zigzag: (
      <svg className={baseClasses} viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path 
          d="M0,0L60,60L120,0L180,60L240,0L300,60L360,0L420,60L480,0L540,60L600,0L660,60L720,0L780,60L840,0L900,60L960,0L1020,60L1080,0L1140,60L1200,0V120H0Z" 
          style={{ fill: fillColor }}
        />
      </svg>
    ),
    
    smooth: (
      <svg className={baseClasses} viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path 
          d="M0,0C200,60 400,60 600,60C800,60 1000,60 1200,0V120H0Z" 
          style={{ fill: fillColor }}
        />
      </svg>
    )
  };

  return (
    <div className={`${className}`}>
      {dividers[variant]}
    </div>
  );
};

export default SectionDivider;
