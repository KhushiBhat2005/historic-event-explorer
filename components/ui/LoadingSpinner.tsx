import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
            <div className="absolute border-4 border-solid border-brand-gold rounded-full w-full h-full animate-spin" style={{ animationDuration: '1.5s', borderTopColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent' }}></div>
            <div className="absolute border-4 border-solid border-brand-gold/30 rounded-full w-full h-full"></div>
        </div>
        <p className="text-brand-text-secondary font-serif">Loading History...</p>
    </div>
  );
};

export default LoadingSpinner;
