import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, TextInput, Alert, Platform, Animated 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

// Importações do Firebase
import { auth, db } from './firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ao','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

interface Tarefa {
  id: string;
  title: string;
  description: string;
  time: string;
  status?: 'pendente' | 'concluída';
  notificationId?: string;
}

export default function HomeScreen({ navigation }: any) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<Record<string, Tarefa[]>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [sortBy, setSortBy] = useState<'criacao' | 'alfabetica'>('criacao');
  const useRefScroll = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTasks();
    const unsubscribe = navigation.addListener('focus', () => {
      loadTasks();
    });
    return unsubscribe;
  }, [navigation]);

  // Carrega as tarefas salvas no Firestore para o usuário autenticado.
  const loadTasks = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const docRef = doc(db, 'user_tasks', user.uid); 
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTasks(docSnap.data().tasks);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar as tarefas da nuvem.");
    }
  };

  // Salva e sincroniza o estado atual de tarefas com o Firestore.
  const saveTasks = async (newTasks: Record<string, Tarefa[]>) => {
    setTasks(newTasks);
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'user_tasks', user.uid);
        await setDoc(docRef, { tasks: newTasks }); 
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao sincronizar tarefas com a nuvem.");
    }
  };

  // Alterna o status da tarefa entre 'pendente' e 'concluída'.
  const toggleTaskStatus = async (id: string) => {
    const newTasks = { ...tasks };
    newTasks[selectedDate] = newTasks[newTasks[selectedDate] ? selectedDate : Object.keys(newTasks)[0]].map(t => {
      if (t.id === id) {
        const currentStatus = t.status || 'pendente';
        return { ...t, status: currentStatus === 'pendente' ? 'concluída' : 'pendente' };
      }
      return t;
    });
    await saveTasks(newTasks);
  };

  // Retorna os objetos de datas marcadas para exibição visual no calendário.
  const getMarkedDates = () => {
    const marked: any = {};
    Object.keys(tasks).forEach(date => {
      if (tasks[date] && tasks[date].length > 0) marked[date] = { marked: true, dotColor: '#6d59db' };
    });
    marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#6d59db' };
    return marked;
  };

  // Atualiza o estado do horário escolhido no componente DateTimePicker.
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowPicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  };

  // Cria uma nova tarefa ou atualiza uma existente após validação.
  const handleSaveTask = async () => {
    if (!title || !time) return Alert.alert("Erro", "Preencha título e horário.");
    const newTasks = { ...tasks };
    if (!newTasks[selectedDate]) newTasks[selectedDate] = [];
    
    if (editingTaskId) {
      newTasks[selectedDate] = newTasks[newTasks[selectedDate] ? selectedDate : Object.keys(newTasks)[0]].map(t => 
        t.id === editingTaskId ? { ...t, title, description, time } : t
      );
    } else {
      newTasks[selectedDate].push({ 
        id: Date.now().toString(), 
        title, 
        description, 
        time, 
        status: 'pendente'
      });
    }
    await saveTasks(newTasks);
    setModalVisible(false);
    setTitle(''); setTime(''); setDescription(''); setEditingTaskId(null);
  };

  // Exibe um alerta de confirmação antes de enviar a tarefa para a lixeira.
  const confirmDelete = (id: string) => {
    Alert.alert(
      "Excluir Tarefa",
      "Esta tarefa será encaminhada para a lixeira e será apagada definitivamente após 60 dias. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deleteTask(id) }
      ]
    );
  };

  // Move a tarefa para a lixeira no Firestore e a remove da lista ativa.
  const deleteTask = async (id: string) => {
    const newTasks = { ...tasks };
    const tarefaParaLixeira = newTasks[selectedDate]?.find(t => t.id === id);

    if (tarefaParaLixeira) {
      try {
        const user = auth.currentUser;
        if (user) {
          const lixeiraRef = doc(db, 'user_trash', user.uid);
          const lixeiraSnap = await getDoc(lixeiraRef);
          let tarefasLixeiraAtuais = [];

          if (lixeiraSnap.exists()) {
            tarefasLixeiraAtuais = lixeiraSnap.data().deletedTasks || [];
          }

          const novasTarefasLixeira = [
            ...tarefasLixeiraAtuais,
            {
              ...tarefaParaLixeira,
              deletedAt: new Date().toISOString(),
              originalDate: selectedDate
            }
          ];

          await setDoc(lixeiraRef, { deletedTasks: novasTarefasLixeira });
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível mover a tarefa para a lixeira no banco.");
        return;
      }
    }
    
    newTasks[selectedDate] = newTasks[selectedDate].filter(t => t.id !== id);
    await saveTasks(newTasks);
  };

  // Retorna a lista de tarefas da data selecionada ordenada pelo critério escolhido.
  const getSortedTasks = () => {
    const listaAtual = tasks[selectedDate] || [];
    return [...listaAtual].sort((a, b) => {
      if (sortBy === 'alfabetica') {
        return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
      }
      return a.id.localeCompare(b.id);
    });
  };

  const calendarOpacity = scrollY.interpolate({
    inputRange: [0, 260],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const calendarTranslateY = scrollY.interpolate({
    inputRange: [0, 260],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });

  // NOVA ANIMAÇÃO: Faz o cabeçalho de tarefas travar no topo assim que a rolagem passa de 260px (altura do calendário)
  const stickyHeaderTranslateY = scrollY.interpolate({
    inputRange: [-1, 0, 260, 261],
    outputRange: [0, 0, 0, 1],
  });

  const fabTranslateY = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 130],
    extrapolate: 'clamp',
  });

  const totalTasksCount = tasks[selectedDate]?.length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.menuBtn}>
          <Text style={styles.menuBtnText}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Minha Agenda</Text>
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {menuVisible && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity 
            style={styles.menuOption} 
            onPress={() => { setMenuVisible(false); navigation.navigate('Bin'); }}
          >
            <Text style={styles.menuOptionText}>🗑️ Lixeira</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.FlatList
        data={getSortedTasks()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 320 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={
          // MODIFICADO: Adicionado zIndex para garantir que o cabeçalho renderize visualmente por cima das linhas que sobem
          <View style={{ backgroundColor: '#fff', zIndex: 99 }}>
            <Animated.View style={{ opacity: calendarOpacity, transform: [{ translateY: calendarTranslateY }] }}>
              <Calendar onDayPress={(day: any) => setSelectedDate(day.dateString)} markedDates={getMarkedDates()} />
            </Animated.View>

            {/* MODIFICADO: Envolvido em um Animated.View com fundo branco e a nova animação de trava */}
            <Animated.View style={{ backgroundColor: '#fff', transform: [{ translateY: stickyHeaderTranslateY }], zIndex: 100, paddingBottom: 4 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Minhas Tarefas ({totalTasksCount})</Text>
                <Text style={styles.sectionDate}>{selectedDate.split('-').reverse().join('/')}</Text>
              </View>

              <View style={styles.filterBar}>
                <TouchableOpacity 
                  style={[styles.filterBtn, sortBy === 'criacao' && styles.filterBtnActive]} 
                  onPress={() => setSortBy('criacao')}
                >
                  <Text style={[styles.filterBtnText, sortBy === 'criacao' && styles.filterBtnTextActive]}>🕒 Criação</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.filterBtn, sortBy === 'alfabetica' && styles.filterBtnActive]} 
                  onPress={() => setSortBy('alfabetica')}
                >
                  <Text style={[styles.filterBtnText, sortBy === 'alfabetica' && styles.filterBtnTextActive]}>🔤 Alfabética</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        }
        renderItem={({ item }) => {
          const currentStatus = item.status || 'pendente';
          const isConcluida = currentStatus === 'concluída';
   
          return (
            <View style={[styles.taskCard, isConcluida && styles.taskConcluida]}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleTaskStatus(item.id)}>
                <Text style={[styles.taskTitle, isConcluida && styles.textRisca]}>
                  {item.title}
                </Text>
                {item.description ? <Text style={styles.taskDescription}>{item.description}</Text> : null}
                <Text style={styles.taskInfo}>⏰ {item.time} - {currentStatus.toUpperCase()}</Text>
              </TouchableOpacity>

              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => { setEditingTaskId(item.id); setTitle(item.title); setDescription(item.description); setTime(item.time); setModalVisible(true); }}>
                  <Text style={styles.editText}>Editar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                  <Text style={styles.deleteText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <Animated.View style={[styles.fabContainer, { transform: [{ translateY: fabTranslateY }] }]}>
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Nova Tarefa</Text>
            <TextInput placeholder="Título" style={styles.input} value={title} onChangeText={setTitle} />
            <TextInput placeholder="Descrição" style={[styles.input, { height: 70 }]} multiline value={description} onChangeText={setDescription} />
                                 
            <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
              <Text>{time ? `⏰ ${time}` : 'Escolher Horário'}</Text>
            </TouchableOpacity> 
            
            {showPicker && <DateTimePicker value={new Date()} mode="time" is24Hour={true} onChange={onTimeChange} />}
            
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {setModalVisible(false); setEditingTaskId(null);}} style={{ marginTop: 15 }}>
              <Text>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5, backgroundColor: '#ffffff' },
  topBarTitle: { fontSize: 24, fontWeight: 'bold', color: '#6d59db', flex: 1, textAlign: 'center' }, 
  logoutBtn: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 10, justifyContent: 'center' },
  logoutText: { color: '#666', fontWeight: '600' },
  menuBtn: { padding: 8, borderRadius: 10, justifyContent: 'center' },
  menuBtnText: { color: '#6d59db', fontSize: 26, fontWeight: 'bold' },
  menuDropdown: { position: 'absolute', top: 60, left: 20, backgroundColor: '#ffffff', borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, zIndex: 999, width: 150 },
  menuOption: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  menuOptionText: { fontSize: 16, color: '#333', fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, marginBottom: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#6d59db' },
  sectionDate: { color: '#888' },
  taskCard: { padding: 15, marginHorizontal: 20, marginVertical: 4, backgroundColor: '#f9f9f9', borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  taskConcluida: { backgroundColor: '#d1ffd1', opacity: 0.8 },
  textRisca: { textDecorationLine: 'line-through', color: '#888' },
  taskTitle: { fontSize: 16, fontWeight: 'bold' },
  taskDescription: { fontSize: 14, color: '#666' },
  taskInfo: { fontSize: 12, color: '#999', marginTop: 4 },
  actionButtons: { flexDirection: 'row' },
  editText: { color: '#6d59db', marginRight: 15, fontWeight: 'bold' },
  deleteText: { color: '#d32f2f', fontWeight: 'bold' },
  fabContainer: { position: 'absolute', right: 25, bottom: 25 },
  fab: { width: 60, height: 60, backgroundColor: '#6d59db', borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  fabText: { color: '#fff', fontSize: 35 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 25, padding: 25, alignItems: 'center' },
  modalHeader: {fontSize: 18, fontWeight: 'bold', marginBottom: 15},
  input: { backgroundColor: '#f5f5f5', width: '100%', padding: 15, borderRadius: 12, marginBottom: 12 },
  saveButton: { backgroundColor: '#6d59db', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  filterBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 8 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  filterBtnActive: { backgroundColor: '#6d59db' },
  filterBtnText: { color: '#666', fontWeight: '600', fontSize: 13 },
  filterBtnTextActive: { color: '#fff' }
});