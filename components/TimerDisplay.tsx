import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimerDisplayProps {
  currentTask: string;
  remainingTime: string;
  progress: number;
  status: string;
}

export function TimerDisplay({
  currentTask,
  remainingTime,
  progress,
  status,
}: TimerDisplayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>현재 작업</Text>
        <Text style={styles.currentTask} numberOfLines={2}>
          {currentTask || '-'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>남은 시간</Text>
        <Text style={styles.remainingTime}>{remainingTime}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(100, progress * 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.status}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  currentTask: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  remainingTime: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  progressTrack: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 999,
  },
  status: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});
