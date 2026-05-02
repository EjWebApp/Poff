import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { X, Plus, Trash2 } from 'lucide-react-native';
import type { Routine } from '../lib/routineStorage';

type Props = {
  visible: boolean;
  routines: Routine[];
  onSelect: (routine: Routine) => void;
  onDelete: (routineId: string) => void;
  onNew: () => void;
  onClose: () => void;
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return '';
  }
}

export function RoutineListModal({ visible, routines, onSelect, onDelete, onNew, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>루틴 불러오기</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Pressable style={styles.newBtn} onPress={() => { onNew(); onClose(); }}>
            <Plus size={15} color="#d97706" />
            <Text style={styles.newBtnText}>새 루틴 만들기</Text>
          </Pressable>

          <FlatList
            data={routines}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const preview = item.inputText
                .split('\n')
                .filter(Boolean)
                .slice(0, 2)
                .join(' · ');

              return (
                <View style={styles.row}>
                  <Pressable
                    style={styles.rowContent}
                    onPress={() => { onSelect(item); onClose(); }}
                  >
                    <View style={styles.rowTop}>
                      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.date}>{formatDate(item.lastUsedAt)}</Text>
                    </View>
                    {preview ? (
                      <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
                    ) : null}
                  </Pressable>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => onDelete(item.id)}
                    hitSlop={8}
                  >
                    <Trash2 size={16} color="#d1d5db" />
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>저장된 루틴이 없어요{'\n'}시작 버튼을 누르면 자동 저장돼요</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  newBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
  },
  list: {
    flexShrink: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowContent: {
    flex: 1,
    paddingVertical: 14,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
  },
  preview: {
    marginTop: 3,
    fontSize: 13,
    color: '#6b7280',
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
    paddingVertical: 32,
  },
});
