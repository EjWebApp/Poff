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
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>
      <View style={styles.buttonRow}>
        <Pressable style={styles.button} onPress={onSave}>
          <Save size={16} color="#6b7280" />
          <Text style={styles.buttonText}>저장</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={onLoad}>
          <Upload size={16} color="#6b7280" />
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
    backgroundColor: '#fafaf9',
    borderRadius: 16,
  },
  input: {
    flex: 1,
    color: '#1f2937',
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
    backgroundColor: '#f5f5f4',
    borderRadius: 12,
  },
  buttonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
});