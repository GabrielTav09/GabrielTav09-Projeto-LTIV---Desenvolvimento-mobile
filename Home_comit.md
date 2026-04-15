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

// --- CONFIGURAÇÃO DE NOTIFICAÇÕES ---
// Define como o app se comporta quando uma notificação chega com o app aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // Mostra o alerta visual
    shouldPlaySound: true,   // Toca o som
    shouldSetBadge: false,   // Não altera o número no ícone do app
  }),
});

// --- TRADUÇÃO DO CALENDÁRIO ---
// Configura a biblioteca externa para exibir meses e dias em Português
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
  notificationId?: string; // ID gerado pelo sistema de notificações para podermos cancelar depois
}

export default function HomeScreen({ navigation }: any) {
  // --- ESTADOS (VARIÁVEIS REATIVAS) ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Data atual (AAAA-MM-DD)
  const [tasks, setTasks] = useState<Record<string, Tarefa[]>>({}); // Objeto que guarda as listas de tarefas por data
  const [modalVisible, setModalVisible] = useState(false); // Controla se o Modal de cadastro está aberto
  
  // Estados para os campos do formulário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null); // Armazena ID se estivermos editando
  const [showPicker, setShowPicker] = useState(false); // Controla a exibição do relógio (Android/iOS)

  // Executa uma vez ao abrir a tela: carrega dados e pede permissão de notificação
  useEffect(() => { loadTasks(); requestPermissions(); }, []);

  // Solicita permissão do usuário para enviar alertas
  async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') Alert.alert("Aviso", "Ative as notificações para ser lembrado.");
  }

  // Busca as tarefas salvas no armazenamento interno do celular (disco)
  const loadTasks = async () => {
    const data = await AsyncStorage.getItem('@tasks');
    if (data) setTasks(JSON.parse(data)); // Converte de String para Objeto JSON
  };

  // Salva as tarefas no armazenamento interno e atualiza o estado da tela
  const saveTasks = async (newTasks: Record<string, Tarefa[]>) => {
    setTasks(newTasks);
    await AsyncStorage.setItem('@tasks', JSON.stringify(newTasks)); // Converte para String para salvar
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
    // Destaca também o dia que o usuário clicou no momento
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

    let notificationId = undefined;
    try {
      // Lógica de Notificação: tenta agendar para 15 minutos antes do horário da tarefa
      const [h, m] = time.split(':').map(Number);
      const trigger = new Date(selectedDate + 'T00:00:00');
      trigger.setHours(h, m - 15);

      // Se o horário de aviso ainda não passou (é no futuro)
      if (trigger > new Date()) {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: { 
            title: "Lembrete ⏰", 
            body: `Sua tarefa "${title}" começa em 15 minutos!` 
          },
          trigger,
        });
      }
    } catch (e) { 
      console.log("Erro na notificação", e); 
    }

    // Se estiver editando, substitui o item. Se for nova, faz um push (adiciona ao fim).
    if (editingTaskId) {
      newTasks[selectedDate] = newTasks[selectedDate].map(t => 
        t.id === editingTaskId ? { ...t, title, description, time, notificationId } : t
      );
    } else {
      newTasks[selectedDate].push({ 
        id: Date.now().toString(), title, description, time, status: 'pendente', notificationId 
      });
    }

    await saveTasks(newTasks);
    setModalVisible(false);
    // Limpa os campos para o próximo uso
    setTitle(''); setTime(''); setDescription(''); setEditingTaskId(null);
  };

  // Mostra um alerta de confirmação antes de apagar
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
    const taskToDelete = newTasks[selectedDate].find(t => t.id === id);
    
    // Cancela o lembrete no celular se ele existir
    if (taskToDelete?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(taskToDelete.notificationId);
    }
    
    newTasks[selectedDate] = newTasks[selectedDate].filter(t => t.id !== id);
    await saveTasks(newTasks);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Minha Agenda</Text>
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Calendário Interativo */}
      <Calendar 
        onDayPress={(day: any) => setSelectedDate(day.dateString)} 
        markedDates={getMarkedDates()} 
      />
      
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
              {/* Lado esquerdo: Título e Descrição (Clica para concluir) */}
              <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleTaskStatus(item.id)}>
                <Text style={[styles.taskTitle, isConcluida && styles.textRisca]}>
                  {item.title}
                </Text>
                {item.description ? <Text style={styles.taskDescription}>{item.description}</Text> : null}
                <Text style={styles.taskInfo}>⏰ {item.time} - {currentStatus.toUpperCase()}</Text>
              </TouchableOpacity>

              {/* Lado direito: Botões de Ação */}
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => { 
                  setEditingTaskId(item.id); 
                  setTitle(item.title); 
                  setDescription(item.description); 
                  setTime(item.time); 
                  setModalVisible(true); 
                }}>
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

      {/* Botão Flutuante (Add) */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Janela de Cadastro/Edição */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>{editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}</Text>
            
            <TextInput placeholder="Título" style={styles.input} value={title} onChangeText={setTitle} />
            <TextInput placeholder="Descrição" style={[styles.input, { height: 70 }]} multiline value={description} onChangeText={setDescription} />
            
            {/* Botão que abre o seletor de horas */}
            <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
              <Text>{time ? `⏰ ${time}` : 'Escolher Horário'}</Text>
            </TouchableOpacity>

            {/* Componente nativo de relógio */}
            {showPicker && (
              <DateTimePicker 
                value={new Date()} 
                mode="time" 
                is24Hour={true} 
                onChange={onTimeChange} 
              />
            )}

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