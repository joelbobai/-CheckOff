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
type SortMode = 'newest' | 'oldest' | 'alphabetical';

const STORAGE_KEY = 'checkoff_tasks';
const QUICK_TEMPLATES = ['Drink water', 'Reply to emails', 'Stretch for 5 min', 'Plan tomorrow'];

export default function CheckOffScreen() {
  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

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
  const quickTemplateState = useMemo(
    () =>
      QUICK_TEMPLATES.map((template) => ({
        label: template,
        exists: tasks.some((task) => task.title.toLowerCase() === template.toLowerCase()),
      })),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const baseTasks = tasks.filter((task) => {
      if (filter === 'active') {
        return !task.completed;
      }

      if (filter === 'completed') {
        return task.completed;
      }

      return true;
    });

    const search = searchQuery.trim().toLowerCase();
    const matchingTasks = search
      ? baseTasks.filter((task) => task.title.toLowerCase().includes(search))
      : baseTasks;

    const sortedTasks = [...matchingTasks].sort((a, b) => {
      if (sortMode === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }

      const byCreated = Number(a.id) - Number(b.id);
      return sortMode === 'oldest' ? byCreated : -byCreated;
    });

    return sortedTasks;
  }, [filter, searchQuery, sortMode, tasks]);

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

  const addTaskWithTitle = (title: string) => {
    const trimmedValue = title.trim();
    if (!trimmedValue) {
      return;
    }

    const newTask: TodoItem = {
      id: Date.now().toString(),
      title: trimmedValue,
      completed: false,
    };

    setTasks((currentTasks) => [newTask, ...currentTasks]);
  };

  const addTask = () => {
    addTaskWithTitle(inputValue);
    setInputValue('');
  };

  const addTemplateTask = (title: string) => {
    const alreadyExists = tasks.some((task) => task.title.toLowerCase() === title.toLowerCase());
    if (alreadyExists) {
      return;
    }

    addTaskWithTitle(title);
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

  const toggleAllTasks = () => {
    const shouldCompleteAll = tasks.some((task) => !task.completed);
    setTasks((currentTasks) =>
      currentTasks.map((task) => ({
        ...task,
        completed: shouldCompleteAll,
      })),
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.overline}>YOUR DAY, ORGANIZED</Text>
              <Text style={styles.heading}>CheckOff</Text>
            </View>
            <View style={styles.permissionBadge}>
              <Text style={styles.permissionBadgeText}>No permissions</Text>
            </View>
          </View>
          <Text style={styles.subheading}>{completionRate}% complete today</Text>
          <Text style={styles.helperText}>
            Quick Add works fully offline, so you can build your list without enabling any device permissions.
          </Text>
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

        <View style={styles.quickAddSection}>
          <View style={styles.quickAddHeader}>
            <Text style={styles.quickAddTitle}>Quick Add</Text>
            <Text style={styles.quickAddSubtitle}>One tap, zero permissions</Text>
          </View>
          <View style={styles.quickAddRow}>
            {quickTemplateState.map((template) => (
              <Pressable
                key={template.label}
                onPress={() => addTemplateTask(template.label)}
                disabled={template.exists}
                style={[styles.quickAddChip, template.exists && styles.quickAddChipDisabled]}>
                <Text
                  style={[
                    styles.quickAddChipText,
                    template.exists && styles.quickAddChipTextDisabled,
                  ]}>
                  {template.exists ? `Added: ${template.label}` : `+ ${template.label}`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TextInput
          placeholder="Search tasks"
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />

        <View style={styles.filterRow}>
          {(['all', 'active', 'completed'] as Filter[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filterButton, filter === item && styles.filterButtonActive]}>
              <Text
                style={[styles.filterButtonText, filter === item && styles.filterButtonTextActive]}>
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

        <View style={styles.secondaryActionsRow}>
          <Pressable onPress={toggleAllTasks} style={styles.secondaryActionButton}>
            <Text style={styles.secondaryActionText}>
              {activeCount === 0 ? 'Mark all active' : 'Mark all done'}
            </Text>
          </Pressable>

          <View style={styles.sortRow}>
            {(['newest', 'oldest', 'alphabetical'] as SortMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setSortMode(mode)}
                style={[styles.sortButton, sortMode === mode && styles.sortButtonActive]}>
                <Text style={[styles.sortButtonText, sortMode === mode && styles.sortButtonTextActive]}>
                  {mode === 'alphabetical' ? 'A-Z' : mode[0].toUpperCase() + mode.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
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

              <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>
                {item.title}
              </Text>

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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
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
  permissionBadge: {
    backgroundColor: '#0b1324',
    borderColor: '#2563eb',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  permissionBadgeText: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '700',
  },
  subheading: {
    color: '#94a3b8',
    marginTop: 8,
    marginBottom: 6,
  },
  helperText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
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
  quickAddSection: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  quickAddHeader: {
    marginBottom: 10,
  },
  quickAddTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  quickAddSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAddChip: {
    backgroundColor: '#111827',
    borderColor: '#1d4ed8',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickAddChipDisabled: {
    borderColor: '#1f2937',
    backgroundColor: '#0b1324',
  },
  quickAddChipText: {
    color: '#dbeafe',
    fontWeight: '600',
    fontSize: 12,
  },
  quickAddChipTextDisabled: {
    color: '#64748b',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0b1324',
    color: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    marginBottom: 10,
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
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  secondaryActionButton: {
    backgroundColor: '#1f2937',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryActionText: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
  },
  sortButton: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sortButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  sortButtonText: {
    color: '#9ca3af',
    fontWeight: '700',
    fontSize: 11,
  },
  sortButtonTextActive: {
    color: '#eff6ff',
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
