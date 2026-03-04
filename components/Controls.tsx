import { Play, Pause, RotateCcw, Square, SkipForward } from 'lucide-react-native';
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface ControlsProps {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onPass: () => void;
  isRunning: boolean;
  isPaused: boolean;
}

export function Controls({
  onStart,
  onPause,
  onResume,
  onStop,
  onPass,
  isRunning,
  isPaused,
}: ControlsProps) {
  return (
    <View style={styles.container}>
      {!isRunning ? (
        <Pressable style={[styles.button, styles.buttonStart]} onPress={onStart}>
          <Play size={18} color="#d97706" fill="#d97706" />
          <Text style={styles.buttonText}>시작</Text>
        </Pressable>
      ) : (
        <>
          {isPaused ? (
            <Pressable
              style={[styles.button, styles.buttonResume]}
              onPress={onResume}
            >
              <RotateCcw size={18} color="#059669" />
              <Text style={styles.buttonText}>재개</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.button, styles.buttonPause]}
              onPress={onPause}
            >
              <Pause size={18} color="#374151" />
              <Text style={styles.buttonText}>일시정지</Text>
            </Pressable>
          )}
          <Pressable style={[styles.button, styles.buttonPass]} onPress={onPass}>
            <SkipForward size={18} color="#ca8a04" />
            <Text style={styles.buttonText}>패스</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonStop]} onPress={onStop}>
            <Square size={18} color="#dc2626" fill="#dc2626" />
            <Text style={styles.buttonText}>종료</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonStart: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  buttonPause: {
    backgroundColor: '#f5f5f4',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonResume: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  buttonPass: {
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fde047',
  },
  buttonStop: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
});
