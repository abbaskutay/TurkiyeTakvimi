import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

/**
 * Custom hook that listens to live compass heading from device sensors
 * with jitter/noise filtering to prevent excessive re-renders.
 */
export function useCompassSensor(thresholdDegrees: number = 0.5) {
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [compassAvailable, setCompassAvailable] = useState<boolean>(true);
  const lastHeadingRef = useRef<number>(0);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startHeadingWatch = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          subscription = await Location.watchHeadingAsync(data => {
            const heading = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
            if (heading >= 0) {
              const diff = Math.abs(heading - lastHeadingRef.current);
              if (diff >= thresholdDegrees || lastHeadingRef.current === 0) {
                lastHeadingRef.current = heading;
                setDeviceHeading(heading);
              }
              setCompassAvailable(true);
            }
          });
        } else {
          setCompassAvailable(false);
        }
      } catch (e) {
        console.log('Compass sensor not available or error:', e);
        setCompassAvailable(false);
      }
    };

    startHeadingWatch();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [thresholdDegrees]);

  return { deviceHeading, compassAvailable };
}
