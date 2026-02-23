import { CheckCircle2, Circle, Play } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import type { Task } from './types';

interface TaskListProps {
  tasks: Task[];
  currentIndex: number;
}

export function TaskList({ tasks, currentIndex }: TaskListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>오늘 루틴</Text>
      {tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>루틴을 입력하고 시작하세요</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {tasks.map((task, index) => {
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <TaskItem
                key={index}
                task={task}
                isDone={isDone}
                isCurrent={isCurrent}
                index={index}
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
}: {
  task: Task;
  isDone: boolean;
  isCurrent: boolean;
  index: number;
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
      <View style={styles.itemContent}>
        <View style={styles.iconWrap}>
          {isDone ? (
            <CheckCircle2 size={18} color="#4ade80" />
          ) : isCurrent ? (
            <Play size={18} color="#a855f7" fill="#a855f7" />
          ) : (
            <Circle size={18} color="rgba(255,255,255,0.2)" />
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
        </View>
      </View>
      <Text style={styles.status}>
        {isDone ? '완료' : isCurrent ? '진행중' : '대기'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  itemCurrent: {
    backgroundColor: 'rgba(168,85,247,0.1)',
    borderColor: 'rgba(168,85,247,0.3)',
  },
  itemDone: {
    opacity: 0.5,
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
    color: '#fff',
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.4)',
  },
  taskDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  status: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});
