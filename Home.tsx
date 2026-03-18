import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface para garantir a estrutura correta dos dados [cite: 6]
interface Tarefa {
  id: string;
  title: string;
  description?: string;
  time?: string;
  status: 'pendente' | 'concluída';
}

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [tasks, setTasks] = useState<Record<string, Tarefa[]>>({});
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estados dos inputs [cite: 7, 8, 10]
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => { loadTasks(); }, []);

  // Recupera dados automaticamente ao abrir [cite: 31]
  const loadTasks = async () => {
    try {
      const data = await AsyncStorage.getItem('@tasks');
      if (data) setTasks(JSON.parse(data));
    } catch (e) {
      Alert.alert("Erro", "Falha ao carregar dados.");
    }
  };

  // Salva as tarefas para persistência [cite: 30]
  const saveTasksToStorage = async (newTasks: Record<string, Tarefa[]>) => {
    try {
      setTasks(newTasks);
      await AsyncStorage.setItem('@tasks', JSON.stringify(newTasks));
    } catch (e) {
      Alert.alert("Erro", "Falha ao salvar dados.");
    }
  };

  const addTask = async () => {
    if (!selectedDate || !title) {
      Alert.alert("Erro", "Selecione uma data e digite um título.");
      return;
    }

    const newTasks = { ...tasks };
    if (!newTasks[selectedDate]) newTasks[selectedDate] = [];
    
    newTasks[selectedDate].push({ 
      id: Date.now().toString(), 
      title, 
      description,
      time,
      status: 'pendente' 
    });

    await saveTasksToStorage(newTasks);
    setModalVisible(false);
    setTitle(''); setDescription(''); setTime('');
  };

  // Função para excluir tarefa 
  const deleteTask = (id: string) => {
    Alert.alert("Excluir", "Deseja remover esta tarefa?", [
      { text: "Cancelar" },
      { 
        text: "Excluir", 
        onPress: async () => {
          const newTasks = { ...tasks };
          newTasks[selectedDate] = newTasks[selectedDate].filter(t => t.id !== id);
          await saveTasksToStorage(newTasks);
        }
      }
    ]);
  };

  // Função para marcar como concluída/pendente 
  const toggleStatus = async (id: string) => {
    const newTasks = { ...tasks };
    newTasks[selectedDate] = newTasks[selectedDate].map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'pendente' ? 'concluída' : 'pendente' };
      }
      return t;
    });
    await saveTasksToStorage(newTasks);
  };

  // Destaque visual no calendário 
  const getMarkedDates = () => {
    const marked: any = {};
    Object.keys(tasks).forEach(date => {
      if (tasks[date].length > 0) {
        marked[date] = { marked: true, dotColor: '#6d59db' };
      }
    });
    marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#6d59db' };
    return marked;
  };

  return (
    <View style={styles.container}>
      <Calendar 
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markedDates={getMarkedDates()}
      />
      
      <View style={styles.headerLista}>
        <Text style={styles.dateTitle}>Tarefas: {selectedDate || 'Selecione um dia'}</Text>
      </View>

      <FlatList
        data={tasks[selectedDate] || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: Tarefa }) => (
          <View style={[styles.taskCard, item.status === 'concluída' && styles.taskDone]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleStatus(item.id)}>
              <Text style={[styles.taskTitle, item.status === 'concluída' && styles.textDone]}>
                {item.status === 'concluída' ? '✅ ' : '⭕ '} {item.title}
              </Text>
              {item.time && <Text style={styles.taskInfo}>⏰ {item.time}</Text>}
              {item.description && <Text style={styles.taskInfo}>{item.description}</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteBtn}>
              <Text style={{ color: 'red', fontWeight: 'bold' }}>Sair</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma tarefa para este dia.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Nova Tarefa</Text>
            <TextInput placeholder="Título *" style={styles.input} value={title} onChangeText={setTitle} />
            <TextInput placeholder="Horário (opcional)" style={styles.input} value={time} onChangeText={setTime} />
            <TextInput placeholder="Descrição" style={[styles.input, { height: 60 }]} multiline value={description} onChangeText={setDescription} />
            <TouchableOpacity style={styles.saveButton} onPress={addTask}>
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerLista: { padding: 15, backgroundColor: '#f8f5fd', borderBottomWidth: 1, borderColor: '#eee' },
  dateTitle: { fontSize: 16, fontWeight: 'bold', color: '#6d59db' },
  taskCard: { 
    padding: 15, backgroundColor: '#fff', marginHorizontal: 10, marginVertical: 5, 
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 
  },
  taskDone: { backgroundColor: '#f0f0f0', opacity: 0.7 },
  taskTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  textDone: { textDecorationLine: 'line-through', color: '#888' },
  taskInfo: { fontSize: 13, color: '#666', marginTop: 2 },
  deleteBtn: { padding: 10 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#999' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, backgroundColor: '#6d59db', borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 30 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 20, padding: 25, alignItems: 'center' },
  modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#f5f5f5', width: '100%', padding: 12, borderRadius: 10, marginBottom: 10 },
  saveButton: { backgroundColor: '#6d59db', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});