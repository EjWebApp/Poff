import { CheckCircle2, Circle, Play } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import type { Task } from './types';

function formatSavedTime(minutes: number): string {
  if (minutes >= 60) {
    return minutes % 60 === 0
      ? `${Math.floor(minutes / 60)}시간`
      : `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;
  }
  return `${minutes}분`;
}

interface TaskListProps {
  tasks: Task[];
  currentIndex: number;
  progress?: number;
  schedule?: { startTime: number; endTime: number }[] | null;
  passedTasks?: Record<number, number>;
  taskMemos?: Record<number, string>;
  onTaskMemoChange?: (index: number, text: string) => void;
}

export function TaskList({ tasks, currentIndex, progress = 0, schedule, passedTasks = {}, taskMemos = {}, onTaskMemoChange }: TaskListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>오늘의 계획</Text>
      {tasks.length === 0 ? (
        <View style={styles.empty}>
<Text style={styles.emptyText}>오늘의 계획을 입력하고 시작하세요</Text>        </View>
      ) : (
        <View style={styles.list}>
          {tasks.map((task, index) => {
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            const timeSlot = schedule && schedule[index];
            const savedMinutes = passedTasks[index];
            const memo = taskMemos[index];
            const itemProgress = isDone ? 1 : isCurrent ? progress : 0;
            return (
              <TaskItem
                key={index}
                task={task}
                isDone={isDone}
                isCurrent={isCurrent}
                index={index}
                startTime={timeSlot?.startTime}
                endTime={timeSlot?.endTime}
                savedMinutes={savedMinutes}
                memo={memo}
                onMemoChange={(text) => onTaskMemoChange?.(index, text)}
                progress={itemProgress}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

function TaskItem({
  task,
  isDone,
  isCurrent,
  index,
  startTime,
  endTime,
  savedMinutes,
  memo,
  onMemoChange,
  progress = 0,
}: {
  task: Task;
  isDone: boolean;
  isCurrent: boolean;
  index: number;
  startTime?: number;
  endTime?: number;
  savedMinutes?: number;
  memo?: string;
  onMemoChange?: (text: string) => void;
  progress?: number;
}) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);

  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 200 }));
    translateX.value = withDelay(index * 50, withTiming(0, { duration: 200 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.item,
        isCurrent && styles.itemCurrent,
        isDone && styles.itemDone,
        animatedStyle,
      ]}
    >
      <View style={styles.itemBody}>
        <View style={styles.itemContent}>
          <View style={styles.iconWrap}>
            {isDone ? (
              <CheckCircle2 size={18} color="#9ca3af" />
            ) : isCurrent ? (
              <Play size={18} color="#FF8B7B" fill="#FF8B7B" />
            ) : (
              <Circle size={18} color="#d1d5db" />
            )}
          </View>
          <View style={styles.itemText}>
            <Text
              style={[
                styles.taskTitle,
                isDone && styles.taskTitleDone,
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            <Text style={styles.taskDuration}>{task.minutes}분</Text>
            {startTime != null && endTime != null && (
              <Text style={styles.taskTime}>
                {new Date(startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ~ {new Date(endTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            {savedMinutes != null && savedMinutes > 0 && (
              <Text style={styles.taskSaved}>
                ⏭ {formatSavedTime(savedMinutes)} 절약
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.status}>
          {isDone ? (savedMinutes != null ? '패스' : '완료') : isCurrent ? '진행중' : '대기'}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressBar, { width: `${Math.min(100, progress * 100)}%` }]}
        />
      </View>
      <TextInput
        style={styles.taskMemoInput}
        placeholder="메모"
        placeholderTextColor="#9ca3af"
        value={memo ?? ''}
        onChangeText={onMemoChange}
        multiline
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  list: {
    gap: 8,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  itemBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTrack: {
    marginTop: 8,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF8B7B',
    borderRadius: 999,
  },
  taskMemoInput: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    minHeight: 36,
    textAlignVertical: 'top',
  },
  itemCurrent: {
    backgroundColor: '#FFF0EE',
    borderColor: '#FF8B7B',
  },
  itemDone: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    marginTop: 2,
  },
  itemText: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskDuration: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  taskTime: {
    fontSize: 11,
    color: '#FF8B7B',
    marginTop: 2,
  },
  taskSaved: {
    fontSize: 11,
    color: '#ca8a04',
    marginTop: 2,
  },
  status: {
    fontSize: 12,
    color: '#6b7280',
  },
});
