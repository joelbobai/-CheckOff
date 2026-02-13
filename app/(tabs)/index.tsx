import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
};

const STORAGE_KEY = 'checkoff_tasks';

export default function CheckOffScreen() {
  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData(tasks);
  }, [tasks]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <Text style={styles.heading}>CheckOff</Text>

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Add a task"
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

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No tasks yet. Add your first one.</Text>}
          renderItem={({ item }) => (
            <View style={styles.taskRow}>
              <Pressable onPress={() => toggleTask(item.id)} style={styles.taskTextContainer}>
                <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>
                  {item.title}
                </Text>
              </Pressable>

              <Pressable onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f4f7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heading: {
    fontSize: 30,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#667085',
    marginTop: 30,
    fontSize: 15,
  },
  taskRow: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eaecf0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    color: '#101828',
    fontSize: 16,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#98a2b3',
  },
  deleteButton: {
    backgroundColor: '#fee4e2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteButtonText: {
    color: '#b42318',
    fontWeight: '600',
  },
});
