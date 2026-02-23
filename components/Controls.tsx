import { Play, Pause, RotateCcw, Square } from 'lucide-react-native';
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface ControlsProps {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isRunning: boolean;
  isPaused: boolean;
}

export function Controls({
  onStart,
  onPause,
  onResume,
  onStop,
  isRunning,
  isPaused,
}: ControlsProps) {
  return (
    <View style={styles.container}>
      {!isRunning ? (
        <Pressable style={[styles.button, styles.buttonStart]} onPress={onStart}>
          <Play size={18} color="#fff" fill="#fff" />
          <Text style={styles.buttonText}>시작</Text>
        </Pressable>
      ) : (
        <>
          {isPaused ? (
            <Pressable
              style={[styles.button, styles.buttonResume]}
              onPress={onResume}
            >
              <RotateCcw size={18} color="#fff" />
              <Text style={styles.buttonText}>재개</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.button, styles.buttonPause]}
              onPress={onPause}
            >
              <Pause size={18} color="#fff" />
              <Text style={styles.buttonText}>일시정지</Text>
            </Pressable>
          )}
          <Pressable style={[styles.button, styles.buttonStop]} onPress={onStop}>
            <Square size={18} color="#fff" fill="#fff" />
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonStart: {
    backgroundColor: 'rgba(168,85,247,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  buttonPause: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonResume: {
    backgroundColor: 'rgba(34,197,94,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  buttonStop: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
});
