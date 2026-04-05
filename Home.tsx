import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, SafeAreaView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração da tradução para Português
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

interface Tarefa {
  id: string;
  title: string;
  description?: string;
  time?: string;
  status: 'pendente' | 'concluída';
}

export default function HomeScreen({ navigation }: any) {
  const [selectedDate, setSelectedDate] = useState('');
  const [tasks, setTasks] = useState<Record<string, Tarefa[]>>({});
  const [modalVisible, setModalVisible] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { 
    loadTasks(); 
    setSelectedDate(today); // Inicia com a data de hoje selecionada
  }, []);

  const loadTasks = async () => {
    try {
      const data = await AsyncStorage.getItem('@tasks');
      if (data) setTasks(JSON.parse(data));
    } catch (e) {
      Alert.alert("Erro", "Falha ao carregar dados.");
    }
  };

  const saveTasksToStorage = async (newTasks: Record<string, Tarefa[]>) => {
    try {
      setTasks(newTasks);
      await AsyncStorage.setItem('@tasks', JSON.stringify(newTasks));
    } catch (e) {
      Alert.alert("Erro", "Falha ao salvar dados.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja retornar à tela de login?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", onPress: () => navigation.replace('Login') }
    ]);
  };

  const openAddModal = () => {
    setEditingTaskId(null);
    setTitle(''); setDescription(''); setTime('');
    setModalVisible(true);
  };

  const openEditModal = (task: Tarefa) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setTime(task.time || '');
    setModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (!selectedDate || !title) {
      Alert.alert("Erro", "Selecione uma data e digite um título.");
      return;
    }

    const newTasks = { ...tasks };
    if (!newTasks[selectedDate]) newTasks[selectedDate] = [];

    if (editingTaskId) {
      newTasks[selectedDate] = newTasks[selectedDate].map(t => 
        t.id === editingTaskId ? { ...t, title, description, time } : t
      );
    } else {
      newTasks[selectedDate].push({ 
        id: Date.now().toString(), 
        title, description, time,
        status: 'pendente' 
      });
    }

    await saveTasksToStorage(newTasks);
    setModalVisible(false);
    setEditingTaskId(null);
    setTitle(''); setDescription(''); setTime('');
  };

  const deleteTask = (id: string) => {
    Alert.alert("Excluir", "Deseja remover esta tarefa?", [
      { text: "Cancelar" },
      { text: "Excluir", onPress: async () => {
          const newTasks = { ...tasks };
          newTasks[selectedDate] = newTasks[selectedDate].filter(t => t.id !== id);
          await saveTasksToStorage(newTasks);
        }
      }
    ]);
  };

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

  const getMarkedDates = () => {
    const marked: any = {};
    Object.keys(tasks).forEach(date => {
      if (tasks[date].length > 0) {
        marked[date] = { marked: true, dotColor: '#6d59db' };
      }
    });
    marked[today] = { ...marked[today], customStyles: { container: { borderWidth: 2, borderColor: '#6d59db', borderRadius: 20 }, text: { color: '#6d59db', fontWeight: 'bold' }}};
    if (selectedDate) { marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#6d59db' }; }
    return marked;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Minha Agenda</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <Calendar 
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markedDates={getMarkedDates()}
        markingType={'custom'}
        theme={{
          selectedDayBackgroundColor: '#6d59db',
          todayTextColor: '#6d59db',
          dotColor: '#6d59db',
          arrowColor: '#6d59db',
        }}
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
            </TouchableOpacity>
            
            {/* BOTÕES DE AÇÃO LADO A LADO */}
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn}>
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma tarefa para este dia.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>{editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}</Text>
            <TextInput placeholder="Título *" style={styles.input} value={title} onChangeText={setTitle} />
            <TextInput placeholder="Horário" style={styles.input} value={time} onChangeText={setTime} />
            <TextInput placeholder="Descrição" style={[styles.input, { height: 60 }]} multiline value={description} onChangeText={setDescription} />
            
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', paddingTop: 40 },
  topBarTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  logoutBtn: { padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },
  logoutBtnText: { color: '#666', fontWeight: '600' },
  headerLista: { padding: 15, backgroundColor: '#f8f5fd', borderBottomWidth: 1, borderColor: '#eee' },
  dateTitle: { fontSize: 16, fontWeight: 'bold', color: '#6d59db' },
  taskCard: { 
    padding: 15, backgroundColor: '#fff', marginHorizontal: 15, marginVertical: 6, 
    borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 3 
  },
  taskDone: { backgroundColor: '#f9f9f9', opacity: 0.6 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  textDone: { textDecorationLine: 'line-through', color: '#888' },
  taskInfo: { fontSize: 12, color: '#777', marginTop: 3 },
  
  // ESTILO DOS BOTÕES CORRIGIDO
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  editBtn: { marginRight: 15, padding: 5 },
  editText: { color: '#6d59db', fontWeight: 'bold' },
  deleteBtn: { padding: 5 },
  deleteText: { color: '#d32f2f', fontWeight: 'bold' },

  emptyText: { textAlign: 'center', marginTop: 40, color: '#bbb' },
  fab: { position: 'absolute', right: 25, bottom: 25, width: 60, height: 60, backgroundColor: '#6d59db', borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: '#fff', fontSize: 30 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 20, padding: 25, alignItems: 'center' },
  modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#f5f5f5', width: '100%', padding: 12, borderRadius: 10, marginBottom: 10 },
  saveButton: { backgroundColor: '#6d59db', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});