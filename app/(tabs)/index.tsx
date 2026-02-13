import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
};

type Filter = 'all' | 'active' | 'completed';

const STORAGE_KEY = 'checkoff_tasks';

export default function CheckOffScreen() {
  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData(tasks);
  }, [tasks]);

  const totalCount = tasks.length;
  const completedCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const activeCount = totalCount - completedCount;
  const completionRate = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = useMemo(() => {
    if (filter === 'active') {
      return tasks.filter((task) => !task.completed);
    }

    if (filter === 'completed') {
      return tasks.filter((task) => task.completed);
    }

    return tasks;
  }, [filter, tasks]);

  const loadData = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.warn('Unable to load tasks:', error);
    }
  };

  const saveData = async (nextTasks: TodoItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
    } catch (error) {
      console.warn('Unable to save tasks:', error);
    }
  };

  const addTask = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) {
      return;
    }

    const newTask: TodoItem = {
      id: Date.now().toString(),
      title: trimmedValue,
      completed: false,
    };

    setTasks((currentTasks) => [newTask, ...currentTasks]);
    setInputValue('');
  };

  const toggleTask = (id: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const deleteTask = (id: string) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
  };

  const clearCompleted = () => {
    setTasks((currentTasks) => currentTasks.filter((task) => !task.completed));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.overline}>YOUR DAY, ORGANIZED</Text>
          <Text style={styles.heading}>CheckOff</Text>
          <Text style={styles.subheading}>{completionRate}% complete today</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statNumber}>{activeCount}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statNumber}>{totalCount}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            placeholder="What needs to get done?"
            placeholderTextColor="#94a3b8"
            value={inputValue}
            onChangeText={setInputValue}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={addTask}
          />
          <Pressable onPress={addTask} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {(['all', 'active', 'completed'] as Filter[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filterButton, filter === item && styles.filterButtonActive]}>
              <Text style={[styles.filterButtonText, filter === item && styles.filterButtonTextActive]}>
                {item[0].toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={clearCompleted}
            style={[styles.clearButton, completedCount === 0 && styles.clearButtonDisabled]}
            disabled={completedCount === 0}>
            <Text style={styles.clearButtonText}>Clear done</Text>
          </Pressable>
        </View>

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No tasks in this view.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => toggleTask(item.id)} style={styles.taskRow}>
              <View style={[styles.checkCircle, item.completed && styles.checkCircleDone]}>
                {item.completed ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>

              <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>{item.title}</Text>

              <Pressable onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </Pressable>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#060b17',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  overline: {
    color: '#93c5fd',
    fontSize: 11,
    letterSpacing: 1.3,
    fontWeight: '600',
    marginBottom: 4,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subheading: {
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 10,
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#38bdf8',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#111b32',
    borderColor: '#223055',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statNumber: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0b1324',
    color: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: '#0b1324',
    borderColor: '#1e293b',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  filterButtonText: {
    color: '#93a5bf',
    fontWeight: '600',
    fontSize: 13,
  },
  filterButtonTextActive: {
    color: '#eff6ff',
  },
  clearButton: {
    marginLeft: 'auto',
    backgroundColor: '#3f1d27',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
  clearButtonText: {
    color: '#fecdd3',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    gap: 10,
    paddingBottom: 30,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 32,
    fontSize: 15,
  },
  taskRow: {
    backgroundColor: '#0b1324',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#17233d',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleDone: {
    backgroundColor: '#2563eb',
  },
  checkMark: {
    color: '#eff6ff',
    fontWeight: '800',
  },
  taskText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 16,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  deleteButton: {
    backgroundColor: '#3f1d27',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteButtonText: {
    color: '#fecdd3',
    fontWeight: '700',
    fontSize: 12,
  },
});
