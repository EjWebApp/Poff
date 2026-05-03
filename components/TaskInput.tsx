import { Save, Upload, FilePlus } from 'lucide-react-native';
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
  onNew?: () => void;
  routineName: string;
  onRoutineNameChange: (name: string) => void;
  isRunning?: boolean;
}

export function TaskInput({ value, onChange, onSave, onLoad, onNew, routineName, onRoutineNameChange, isRunning = false }: TaskInputProps) {
  const inputRef = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TextInput
        style={styles.nameInput}
        value={routineName}
        onChangeText={onRoutineNameChange}
        placeholder="루틴 이름 (저장 시 자동 생성)"
        placeholderTextColor="#9ca3af"
        returnKeyType="done"
      />
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
        <Pressable
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={isRunning ? undefined : onLoad}
        >
          <Upload size={16} color={isRunning ? '#d1d5db' : '#6b7280'} />
          <Text style={[styles.buttonText, isRunning && styles.buttonTextDisabled]}>불러오기</Text>
        </Pressable>
        {onNew ? (
          <Pressable
            style={[styles.button, isRunning && styles.buttonDisabled]}
            onPress={isRunning ? undefined : onNew}
          >
            <FilePlus size={16} color={isRunning ? '#d1d5db' : '#6b7280'} />
            <Text style={[styles.buttonText, isRunning && styles.buttonTextDisabled]}>새 루틴</Text>
          </Pressable>
        ) : null}
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
    backgroundColor: '#FAF7F2',
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
  buttonDisabled: {
    backgroundColor: '#f5f5f4',
    opacity: 0.4,
  },
  buttonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextDisabled: {
    color: '#9ca3af',
  },
  nameInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});
