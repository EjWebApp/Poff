import { Save, Upload } from 'lucide-react-native';
import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface TaskInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onLoad: () => void;
}

export function TaskInput({ value, onChange, onSave, onLoad }: TaskInputProps) {
  const inputRef = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="예: 차준비ㅡ20 (한 줄에 하나씩)"
          placeholderTextColor="rgba(255,255,255,0.4)"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>
      <View style={styles.buttonRow}>
        <Pressable style={styles.button} onPress={onSave}>
          <Save size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.buttonText}>저장</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={onLoad}>
          <Upload size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.buttonText}>불러오기</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  inputWrapper: {
    minHeight: 180,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    lineHeight: 26,
    padding: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  buttonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
});