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

export function Controls({ onStart, onPause, onResume, onStop, onPass, isRunning, isPaused }: ControlsProps) {
  return (
    <View style={styles.container}>
      {!isRunning ? (
        <Pressable style={[styles.button, styles.buttonStart]} onPress={onStart}>
          <Play size={18} color="#fff" fill="#fff" />
          <Text style={styles.buttonTextPrimary}>시작</Text>
        </Pressable>
      ) : (
        <>
          {isPaused ? (
            <Pressable style={[styles.button, styles.buttonResume]} onPress={onResume}>
              <RotateCcw size={18} color="#7DD3C0" />
              <Text style={styles.buttonText}>재개</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.button, styles.buttonPause]} onPress={onPause}>
              <Pause size={18} color="#2D2D2D" />
              <Text style={styles.buttonText}>일시정지</Text>
            </Pressable>
          )}
          <Pressable style={[styles.button, styles.buttonPass]} onPress={onPass}>
            <SkipForward size={18} color="#A78BFA" />
            <Text style={styles.buttonText}>패스</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonStop]} onPress={onStop}>
            <Square size={18} color="#FF8B7B" fill="#FF8B7B" />
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
    borderRadius: 99,
  },
  buttonText: {
    color: '#2D2D2D',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonStart: {
    backgroundColor: '#FF8B7B',
    shadowColor: '#FF8B7B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonPause: {
    backgroundColor: '#F5F0E8',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  buttonResume: {
    backgroundColor: '#EEF9F7',
    borderWidth: 1,
    borderColor: '#7DD3C0',
  },
  buttonPass: {
    backgroundColor: '#F3EEFF',
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  buttonStop: {
    backgroundColor: '#FFF0EE',
    borderWidth: 1,
    borderColor: '#FF8B7B',
  },
});
