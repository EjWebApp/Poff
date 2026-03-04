import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface TimerDisplayProps {
  currentTask: string;
  remainingTime: string;
  progress: number;
  status: string;
}

const SIZE = 140;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerDisplay({
  currentTask,
  remainingTime,
  progress,
  status,
}: TimerDisplayProps) {
  const strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(1, progress));

  return (
    <View style={styles.container}>
      <View style={styles.circleWrap}>
        <Svg width={SIZE} height={SIZE} style={styles.svg}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#e5e7eb"
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#d97706"
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.timeCenter}>
          <Text style={styles.remainingTime}>{remainingTime}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>현재 작업</Text>
        <Text style={styles.currentTask} numberOfLines={2}>
          {currentTask || '-'}
        </Text>
      </View>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  circleWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  timeCenter: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingTime: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: 2,
  },
  section: {
    gap: 4,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#9ca3af',
  },
  currentTask: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  status: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
