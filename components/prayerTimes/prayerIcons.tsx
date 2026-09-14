import React from 'react';
import {
  Sunrise,
  Sun,
  SunMedium,
  Sunset,
  MoonStar,
  Clock,
  Compass,
  AlertTriangle,
  Stars,
  CloudMoon,
} from 'lucide-react-native';

/**
 * Returns a themed Lucide icon for any of the 18 prayer or sun-position periods.
 *
 * @param id Prayer identifier (e.g. 'imsak', 'ogle', 'asr_sani', 'kible_saati')
 * @param size Icon size in points (default: 20)
 * @param color Icon color string (default: '#a01826')
 */
export function getPrayerIcon(id: string, size = 20, color = '#a01826'): React.ReactNode {
  switch (id) {
    case 'imsak':
    case 'sabah':
      return <Sunrise size={size} color={color} />;
    case 'gunes':
    case 'israk':
      return <Sun size={size} color={color} />;
    case 'dahve':
    case 'ogle':
    case 'asr_evvel':
      return <SunMedium size={size} color={color} />;
    case 'kerahet':
    case 'isfirar':
      return <AlertTriangle size={size} color={color} />;
    case 'ikindi':
    case 'asr_sani':
      return <Clock size={size} color={color} />;
    case 'aksam':
    case 'istibak':
      return <Sunset size={size} color={color} />;
    case 'yatsi':
    case 'isa_evvel':
    case 'isa_sani':
      return <MoonStar size={size} color={color} />;
    case 'gece_yarisi':
    case 'teheccud':
      return <Stars size={size} color={color} />;
    case 'seher':
      return <CloudMoon size={size} color={color} />;
    case 'kible_saati':
      return <Compass size={size} color={color} />;
    default:
      return <Clock size={size} color={color} />;
  }
}
