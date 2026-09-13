import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Line,
  Text as SvgText,
  G,
  Path,
  Rect,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { COLORS } from '../../constants';

interface CompassDialProps {
  dialRotation: number;
  targetNeedleAngle: number;
  isAligned: boolean;
  isDarkMode: boolean;
  needleLabel?: string;
  isRTL?: boolean;
}

export const CompassDial: React.FC<CompassDialProps> = ({
  dialRotation,
  targetNeedleAngle,
  isAligned,
  isDarkMode,
  needleLabel = 'KIBLE',
  isRTL = false,
}) => {
  return (
    <View style={[styles.compassWrapper, isAligned && styles.alignedCompassWrapper]}>
      <Svg width="270" height="260" viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="compassGradLight" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#f3f4f6" />
          </RadialGradient>
          <RadialGradient id="compassGradDark" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#222222" />
            <Stop offset="100%" stopColor="#111111" />
          </RadialGradient>
          <RadialGradient id="compassGradAligned" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#15803d" />
            <Stop offset="100%" stopColor="#166534" />
          </RadialGradient>
        </Defs>

        {/* Rotatable Compass Rose / Degree Ring */}
        <G transform={`rotate(${dialRotation}, 100, 100)`}>
          <Circle
            cx="100"
            cy="100"
            r="96"
            fill={
              isAligned
                ? 'url(#compassGradAligned)'
                : isDarkMode
                ? 'url(#compassGradDark)'
                : 'url(#compassGradLight)'
            }
            stroke={isAligned ? '#22c55e' : isDarkMode ? '#333333' : '#e5e7eb'}
            strokeWidth={isAligned ? '3' : '2'}
          />
          <Circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={isAligned ? 'rgba(255,255,255,0.2)' : isDarkMode ? '#222' : '#f0f0f0'}
            strokeWidth="1"
          />

          {/* Tick Marks (Every 5 degrees, major ticks every 30 degrees) */}
          {[...Array(72)].map((_, i) => {
            const ang = i * 5;
            const rad = ((ang - 90) * Math.PI) / 180;
            const isMajor = i % 6 === 0;
            const r1 = isMajor ? 84 : 88;
            const r2 = 94;
            return (
              <Line
                key={i}
                x1={100 + r1 * Math.cos(rad)}
                y1={100 + r1 * Math.sin(rad)}
                x2={100 + r2 * Math.cos(rad)}
                y2={100 + r2 * Math.sin(rad)}
                stroke={
                  isAligned
                    ? '#ffffff'
                    : isMajor
                    ? isDarkMode
                      ? COLORS.accentRed
                      : COLORS.primary
                    : isDarkMode
                    ? '#444'
                    : '#d1d5db'
                }
                strokeWidth={isMajor ? '1.8' : '0.6'}
              />
            );
          })}

          {/* Cardinal Letters (N, E, S, W) */}
          {[
            { ang: 0, label: 'N' },
            { ang: 90, label: 'E' },
            { ang: 180, label: 'S' },
            { ang: 270, label: 'W' },
          ].map(({ ang, label }) => {
            const rad = ((ang - 90) * Math.PI) / 180;
            const x = 100 + 72 * Math.cos(rad);
            const y = 100 + 72 * Math.sin(rad);
            return (
              <SvgText
                key={label}
                x={x}
                y={y + 4}
                fontSize="12"
                fontWeight="900"
                textAnchor="middle"
                fill={
                  isAligned
                    ? '#ffffff'
                    : ang === 0
                    ? isDarkMode
                      ? COLORS.accentRed
                      : COLORS.primary
                    : isDarkMode
                    ? '#6b7280'
                    : '#9ca3af'
                }
              >
                {label}
              </SvgText>
            );
          })}
        </G>

        {/* PROMINENT QIBLA NEEDLE (Arrow pointing directly towards Kaaba) */}
        <G transform={`rotate(${targetNeedleAngle}, 100, 100)`}>
          {/* Subtle Shadow */}
          <Path
            d="M100 20 L112 88 L100 78 L88 88 Z"
            fill="rgba(0,0,0,0.15)"
          />

          {/* Forward Arrowhead (Pointing UP to 12 o'clock / Kaaba) */}
          <Path
            d="M100 22 L112 88 L100 78 L88 88 Z"
            fill={isAligned ? '#22c55e' : isDarkMode ? COLORS.accentRed : COLORS.primary}
          />
          <Path
            d="M100 22 L100 78 L88 88 Z"
            fill={isAligned ? '#16a34a' : isDarkMode ? '#b31d2e' : '#7a101d'}
          />

          {/* Golden Kaaba Badge on the Pointer Tip */}
          <G transform="translate(92, 38)">
            <Rect width="16" height="16" rx="2" fill="#111111" stroke="#d4af37" strokeWidth="1" />
            <Rect y="5" width="16" height="2.5" fill="#d4af37" />
          </G>

          {/* Needle Label on Arrow Shaft */}
          <SvgText
            x="100"
            y="68"
            fontSize="6.5"
            textAnchor="middle"
            fill="#ffffff"
            fontWeight="900"
            letterSpacing={isRTL ? '0' : '0.8'}
          >
            {needleLabel}
          </SvgText>

          {/* Rear Tail (Pointing DOWN to South / opposite) */}
          <Path
            d="M100 160 L108 112 L100 120 L92 112 Z"
            fill={isDarkMode ? '#374151' : '#cbd5e1'}
          />
          <Path
            d="M100 160 L100 120 L92 112 Z"
            fill={isDarkMode ? '#1f2937' : '#94a3b8'}
          />

          {/* Center Pivot Point */}
          <Circle
            cx="100"
            cy="100"
            r="12"
            fill={isAligned ? '#22c55e' : isDarkMode ? '#1e293b' : '#ffffff'}
            stroke={isAligned ? '#ffffff' : isDarkMode ? COLORS.accentRed : COLORS.primary}
            strokeWidth="2.5"
          />
          <Circle
            cx="100"
            cy="100"
            r="4"
            fill={isAligned ? '#ffffff' : isDarkMode ? COLORS.accentRed : COLORS.primary}
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  compassWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  alignedCompassWrapper: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
