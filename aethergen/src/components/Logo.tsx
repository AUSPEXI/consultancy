import React from 'react';

type LogoProps = { className?: string; bg?: 'blue' | 'white' };

const Logo = ({ className = "h-8 w-8", bg = 'blue' }: LogoProps) => {
  return (
    <div className={`${className} relative`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full" 
        role="img" 
        aria-label="Eye of Horus Logo representing the six senses"
      >
        {/* Background circle for contrast (rendered behind strokes) */}
        {bg === 'white' && (
          <circle cx="50" cy="50" r="40" className="fill-white" aria-hidden="true" />
        )}
        {/* Main Eye Body (1/2) - Smell */}
        <path 
          d="M 20,50 C 20,30 40,25 50,25 C 60,25 80,30 80,50" 
          className="text-blue-500 fill-none stroke-current stroke-[8] hover:text-blue-400 transition-colors" 
          data-fraction="1/2" 
          aria-label="Smell - Main eye body representing the sense of smell"
        />
        
        {/* Eyebrow (1/4) - Sight */}
        <path 
          d="M 25,45 C 35,35 65,35 75,45" 
          className="text-blue-600 fill-none stroke-current stroke-[6] hover:text-blue-500 transition-colors" 
          data-fraction="1/4" 
          aria-label="Sight - Eyebrow representing the sense of sight"
        />
        
        {/* Vertical Mark (1/8) - Thought */}
        <path 
          d="M 50,25 L 50,45" 
          className="text-blue-700 fill-none stroke-current stroke-[4] hover:text-blue-600 transition-colors" 
          data-fraction="1/8" 
          aria-label="Thought - Vertical mark representing cognitive ability"
        />
        
        {/* Right Curve (1/16) - Hearing */}
        <path 
          d="M 50,50 C 55,50 70,48 75,45" 
          className="text-blue-800 fill-none stroke-current stroke-[3] hover:text-blue-700 transition-colors" 
          data-fraction="1/16" 
          aria-label="Hearing - Right curve representing the sense of hearing"
        />
        
        {/* Left Curve (1/32) - Taste */}
        <path 
          d="M 25,45 C 30,48 45,50 50,50" 
          className="text-blue-900 fill-none stroke-current stroke-[2] hover:text-blue-800 transition-colors" 
          data-fraction="1/32" 
          aria-label="Taste - Left curve representing the sense of taste"
        />
        
        {/* Bottom Flourish (1/64) - Touch */}
        <path 
          d="M 45,50 L 55,50" 
          className="text-indigo-900 fill-none stroke-current stroke-[1] hover:text-blue-900 transition-colors" 
          data-fraction="1/64" 
          aria-label="Touch - Bottom flourish representing the sense of touch"
        />
        
        {/* Pulsing background circle */}
        {bg !== 'white' && (
          <circle cx="50" cy="50" r="40" className="text-blue-500/20 fill-current animate-pulse" aria-hidden="true" />
        )}
      </svg>
    </div>
  );
};

export default Logo;