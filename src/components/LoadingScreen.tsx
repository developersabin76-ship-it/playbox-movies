import React from 'react';
import { MediaCoreLoading, MediaCoreLoadingProps } from './MediaCoreLoading';

export interface LoadingScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, minDuration = 2600 }) => {
  return (
    <MediaCoreLoading
      isOpen={true}
      onComplete={onComplete}
      minDuration={minDuration}
      tagline="STREAM • WATCH • ENJOY"
      allowSkip={true}
    />
  );
};

export { MediaCoreLoading };
