import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, TextInput, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';


// Tradução do Calendário
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';


// Definição do "molde" de uma tarefa para o TypeScript
interface Tarefa {
  id: string;
  title: string;
  description: string;
  time: string;
  status?: 'pendente' | 'concluída';
  notificationId?: string;
}


export default function HomeScreen({ navigation }: any) {

// --- ESTADOS (VARIÁVEIS REATIVAS) ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<Record<string, Tarefa[]>>({});
  const [modalVisible, setModalVisible] = useState(false);
  
// Estados para os campos do formulário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);



// Busca as tarefas salvas no armazenamento interno do celular (disco)
  const loadTasks = async () => {
    const data = await AsyncStorage.getItem('@tasks');
    if (data) setTasks(JSON.parse(data));
  };
// Salva as tarefas no armazenamento interno e atualiza o estado da tela 
  const saveTasks = async (newTasks: Record<string, Tarefa[]>) => {
    setTasks(newTasks);
    await AsyncStorage.setItem('@tasks', JSON.stringify(newTasks));
  };



// Altera entre Pendente e Concluída
  const toggleTaskStatus = async (id: string) => {
    const newTasks = { ...tasks };
    newTasks[selectedDate] = newTasks[selectedDate].map(t => {
      if (t.id === id) {
        const currentStatus = t.status || 'pendente';
        return { ...t, status: currentStatus === 'pendente' ? 'concluída' : 'pendente' };
      }
      return t;
    });
    await saveTasks(newTasks);
  };



// Cria o objeto de configuração para o componente Calendar destacar dias com tarefas
  const getMarkedDates = () => {
    const marked: any = {};
    Object.keys(tasks).forEach(date => {
      if (tasks[date].length > 0) marked[date] = { marked: true, dotColor: '#6d59db' };
    });
    marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#6d59db' };
    return marked;
  };
// Captura o horário selecionado no relógio e formata para "HH:mm"
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowPicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  };



// Função principal para salvar ou atualizar uma tarefa
const handleSaveTask = async () => {
  if (!title || !time) return Alert.alert("Erro", "Preencha título e horário.");
  const newTasks = { ...tasks };
  if (!newTasks[selectedDate]) newTasks[selectedDate] = [];
  if (editingTaskId) {
    // Atualiza a tarefa existente
    newTasks[selectedDate] = newTasks[selectedDate].map(t => 
      t.id === editingTaskId ? { ...t, title, description, time } : t
    );
  } else {
    // Cria uma nova tarefa
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
// Limpa os campos para o próximo uso
  setTitle(''); setTime(''); setDescription(''); setEditingTaskId(null);
};



// FUNÇÃO DE EXCLUSÃO COM CONFIRMAÇÃO
  const confirmDelete = (id: string) => {
    Alert.alert(
      "Excluir Tarefa",
      "Tem certeza que deseja apagar esta tarefa?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deleteTask(id) }
      ]
    );
  };



// Remove a tarefa e cancela a notificação agendada no sistema
  const deleteTask = async (id: string) => {
  const newTasks = { ...tasks };
  
// Filtra a lista removendo a tarefa com o id correspondente
  newTasks[selectedDate] = newTasks[selectedDate].filter(t => t.id !== id);
  
  await saveTasks(newTasks);
};

return (
  <SafeAreaView style={styles.container}>
    <View style={styles.topBar}>
      <Text style={styles.topBarTitle}>Minha Agenda</Text>
      <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>


{/* Calendário Interativo */}
    <Calendar onDayPress={(day: any) => setSelectedDate(day.dateString)} markedDates={getMarkedDates()} />

{/* Título da Lista (Data formatada para PT-BR) */}      
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Minhas Tarefas</Text>
      <Text style={styles.sectionDate}>{selectedDate.split('-').reverse().join('/')}</Text>
    </View>

{/* Lista de Tarefas do Dia */} 
    <FlatList
      data={tasks[selectedDate] || []}
      keyExtractor={(item) => item.id}
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

            {/* Lado direito: Botões de Ação */}
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => { setEditingTaskId(item.id); setTitle(item.title); setDescription(item.description); setTime(item.time); setModalVisible(true); }}>
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              
              {/* CHAMADA PARA A CONFIRMAÇÃO AQUI */}
              <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                <Text style={styles.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />


{/* Botão Flutuante (Add) */}
    <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
      <Text style={styles.fabText}>+</Text>
    </TouchableOpacity>


{/* Janela de Cadastro/Edição */}
    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalHeader}>Nova Tarefa</Text>
          <TextInput placeholder="Título" style={styles.input} value={title} onChangeText={setTitle} />
          <TextInput placeholder="Descrição" style={[styles.input, { height: 70 }]} multiline value={description} onChangeText={setDescription} />
          
{/* Botão que abre o seletor de horas */}                      
          <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
            <Text>{time ? `⏰ ${time}` : 'Escolher Horário'}</Text>
          </TouchableOpacity> 
          
{/* Componente nativo de relógio */}
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
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5, backgroundColor: '#ffffff' },
  topBarTitle: { fontSize: 24, fontWeight: 'bold', color: '#6d59db' }, 
  logoutBtn: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 10, justifyContent: 'center' },
  logoutText: { color: '#666', fontWeight: '600' },
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
  fab: { position: 'absolute', right: 25, bottom: 25, width: 60, height: 60, backgroundColor: '#6d59db', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 35 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 25, padding: 25, alignItems: 'center' },
  modalHeader: {fontSize: 18, fontWeight: 'bold', marginBottom: 15},
  input: { backgroundColor: '#f5f5f5', width: '100%', padding: 15, borderRadius: 12, marginBottom: 12 },
  saveButton: { backgroundColor: '#6d59db', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});