import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export interface CompassHeadingState {
  heading: number; // Active heading in degrees (0-360)
  trueHeading: number; // True North heading (-1 if unavailable)
  magHeading: number; // Magnetic North heading
  isTrueHeading: boolean; // True if heading is relative to True North
  accuracy: number; // Sensor accuracy level / degrees
  compassAvailable: boolean;
}

/**
 * Custom hook that listens to live compass heading from device sensors
 * with smooth jitter/noise filtering and explicit True vs Magnetic north tracking.
 */
export function useCompassSensor(thresholdDegrees: number = 0.5): CompassHeadingState {
  const [headingState, setHeadingState] = useState<CompassHeadingState>({
    heading: 0,
    trueHeading: -1,
    magHeading: 0,
    isTrueHeading: false,
    accuracy: 3,
    compassAvailable: true,
  });

  const lastHeadingRef = useRef<number>(0);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startHeadingWatch = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          subscription = await Location.watchHeadingAsync(data => {
            const hasTrue = typeof data.trueHeading === 'number' && data.trueHeading >= 0;
            const activeHeading = hasTrue ? data.trueHeading : (data.magHeading >= 0 ? data.magHeading : 0);
            
            const diff = Math.abs(activeHeading - lastHeadingRef.current);
            if (diff >= thresholdDegrees || lastHeadingRef.current === 0) {
              lastHeadingRef.current = activeHeading;
              setHeadingState({
                heading: activeHeading,
                trueHeading: data.trueHeading ?? -1,
                magHeading: data.magHeading ?? 0,
                isTrueHeading: hasTrue,
                accuracy: data.accuracy ?? 3,
                compassAvailable: true,
              });
            }
          });
        } else {
          setHeadingState(prev => ({ ...prev, compassAvailable: false }));
        }
      } catch (e) {
        console.log('Compass sensor error:', e);
        setHeadingState(prev => ({ ...prev, compassAvailable: false }));
      }
    };

    startHeadingWatch();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [thresholdDegrees]);

  return headingState;
}

