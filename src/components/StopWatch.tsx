import React, { useEffect, useState, useCallback } from 'react';

interface StopWatchProps {
  initialTime: number;
  isRunning: boolean;
  onTick: (time: number) => void;
}

const StopWatch: React.FC<StopWatchProps> = React.memo(({ initialTime, isRunning, onTick }) => {
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  
  useEffect(() => {
    setElapsedTime(initialTime);
  }, [initialTime]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isRunning) {
      intervalId = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          onTick(newTime);
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, onTick]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
     if (hours > 0) {
       return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
         2,
         '0',
       )}:${String(seconds).padStart(2, '0')}`;
     } else {
       return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
         2,
         '0',
       )}`;
     }
    // return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  return formatTime(elapsedTime);
});

export default StopWatch; 
