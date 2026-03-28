import React from 'react';
import { Svg, Circle, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
  accent?: string;
};

export function SendQuickIcon({ size = 20, color = '#16A34A', accent = '#22C55E' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 11.5L20.5 4.5L13 21L10.5 13.5L3 11.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M10.6 13.4L20.5 4.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={6.5} cy={6.5} r={2.2} fill={accent} />
    </Svg>
  );
}

export function BudgetQuickIcon({ size = 20, color = '#2563EB', accent = '#3B82F6' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={16} rx={4} stroke={color} strokeWidth={1.8} />
      <Path d="M7 9H17" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M7 12.5H13" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path
        d="M16.5 15.5L19.5 12.5V15.5H16.5Z"
        fill={accent}
      />
      <Circle cx={18} cy={13} r={3} stroke={accent} strokeWidth={1.4} />
    </Svg>
  );
}

export function SaveQuickIcon({ size = 20, color = '#CA8A04', accent = '#F59E0B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 10.5H18L17 20H7L6 10.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M9 7.5H15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M12 7C12 5 14 4.5 15.5 5.5C16.6 6.2 17 7.7 16.2 9"
        stroke={accent}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M12 7C12 5 10 4.5 8.5 5.5C7.4 6.2 7 7.7 7.8 9"
        stroke={accent}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
