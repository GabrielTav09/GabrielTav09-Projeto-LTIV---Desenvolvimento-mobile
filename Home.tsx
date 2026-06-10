import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, TextInput, Alert, Platform, Animated // ALTERADO: Adicionado o módulo Animated para a transição suave do calendário
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

// ADICIONADO: Importações do Firebase para usar o Banco de Dados e pegar o Usuário Logado
import { auth, db } from './firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';


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
  
// ADICIONADO: Estado para controlar a visibilidade do menu de opções no topo esquerdo
  const [menuVisible, setMenuVisible] = useState(false);

// Estados para os campos do formulário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

// ADICIONADO: Estado para gerenciar o critério de ordenação ativo ('criacao' ou 'alfabetica')
  const [sortBy, setSortBy] = useState<'criacao' | 'alfabetica'>('criacao');

// ADICIONADO: Variável reativa controladora do scroll para encolher o calendário dinamicamente
  const scrollY = useRef(new Animated.Value(0)).current;


// CORRIGIDO: Agora recarrega as tarefas sempre que a tela Home ganhar foco (voltar da lixeira)
  useEffect(() => {
    loadTasks(); // Executa ao abrir o app pela primeira vez

    const unsubscribe = navigation.addListener('focus', () => {
      loadTasks(); // Força a atualização vinda do banco sempre que voltar para cá
    });

    return unsubscribe;
  }, [navigation]);


// Busca as tarefas salvas no banco de dados da nuvem (Substituiu o AsyncStorage)
  const loadTasks = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return; // Se não tiver usuário logado, não faz nada
      
      // Cria uma referência para o documento exclusivo deste usuário
      const docRef = doc(db, 'user_tasks', user.uid); 
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setTasks(docSnap.data().tasks); // Puxa as tarefas e joga na tela
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar as tarefas da nuvem.");
    }
  };


// Salva as tarefas no banco de dados da nuvem e atualiza o estado da tela (Substituiu o AsyncStorage)
  const saveTasks = async (newTasks: Record<string, Tarefa[]>) => {
    setTasks(newTasks); // Mantém a atualização instantânea visual na tela
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'user_tasks', user.uid);
        // Salva/Sobrescreve a lista inteira de tarefas dentro do documento do usuário
        await setDoc(docRef, { tasks: newTasks }); 
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao sincronizar tarefas com a nuvem.");
    }
  };


// Altera entre Pendente e Concluída
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


// Cria o objeto de configuração para o componente Calendar destacar dias com tarefas
  const getMarkedDates = () => {
    const marked: any = {};
    Object.keys(tasks).forEach(date => {
      if (tasks[date] && tasks[date].length > 0) marked[date] = { marked: true, dotColor: '#6d59db' };
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
    // Ultrapassa/Atualiza a tarefa existente
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


// ALTERADO: Mensagem de confirmação modificada para avisar sobre o encaminhamento à lixeira por 60 dias
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


// ADICIONADO: Remove a tarefa da listagem ativa e envia para a coleção de lixeira antes de salvar
  const deleteTask = async (id: string) => {
  const newTasks = { ...tasks };
  
  // ADICIONADO: Localiza o objeto da tarefa que está sendo deletada para enviar à lixeira
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

        // ADICIONADO: Envia a tarefa com carimbo de data atual (timestamp) para controle de 60 dias
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
  
// Filtra a lista removendo a tarefa com o id correspondente
  newTasks[selectedDate] = newTasks[selectedDate].filter(t => t.id !== id);
  
  await saveTasks(newTasks);
};

// ADICIONADO: Organiza e retorna dinamicamente as tarefas baseando-se no filtro selecionado
const getSortedTasks = () => {
  const listaAtual = tasks[selectedDate] || [];
  return [...listaAtual].sort((a, b) => {
    if (sortBy === 'alfabetica') {
      return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
    }
    // 'criacao': Ordena cronologicamente usando o ID (timestamp gerado no Date.now())
    return a.id.localeCompare(b.id);
  });
};

// ADICIONADO: Cálculos de interpolação para encolher a altura e sumir com a opacidade do calendário suavemente
const calendarHeight = scrollY.interpolate({
  inputRange: [0, 180],
  outputRange: [315, 0], // Vai de 315px de altura padrão até 0 de acordo com a rolagem
  extrapolate: 'clamp',
});

const calendarOpacity = scrollY.interpolate({
  inputRange: [0, 120],
  outputRange: [1, 0], // Desvanece o calendário antes de sumir totalmente a altura
  extrapolate: 'clamp',
});

// ADICIONADO: Constante para obter dinamicamente a quantidade de tarefas do dia selecionado
const totalTasksCount = tasks[selectedDate]?.length || 0;

return (
  <SafeAreaView style={styles.container}>
    <View style={styles.topBar}>
{/* ADICIONADO: Botão do Menu de Opções no canto superior esquerdo */}
      <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.menuBtn}>
        <Text style={styles.menuBtnText}>☰</Text>
      </TouchableOpacity>

      <Text style={styles.topBarTitle}>Minha Agenda</Text>
      <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>

{/* ADICIONADO: Container do menu Dropdown que aparece ao clicar no botão de 3 barras */}
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

{/* ALTERADO: O Calendário agora fica dentro de um container animado que encolhe suavemente ao rolar a lista */}
    <Animated.View style={{ height: calendarHeight, opacity: calendarOpacity, overflow: 'hidden' }}>
      <Calendar onDayPress={(day: any) => setSelectedDate(day.dateString)} markedDates={getMarkedDates()} />
    </Animated.View>

{/* Título da Lista (ALTERADO: Agora inclui a contagem dinâmica de tarefas ao lado do título) */}      
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Minhas Tarefas ({totalTasksCount})</Text>
      <Text style={styles.sectionDate}>{selectedDate.split('-').reverse().join('/')}</Text>
    </View>

{/* ADICIONADO: Barra de botões para alternar a Ordenação Inteligente de forma dinâmica */}
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

{/* ALTERADO: Trocado para Animated.FlatList e injetado o evento onScroll para dar o efeito dinâmico no calendário */} 
    <Animated.FlatList
      data={getSortedTasks()}
      keyExtractor={(item) => item.id}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false } // Obrigatório como false por alterar propriedade de Layout (height)
      )}
      scrollEventThrottle={16} // Mantém o fluxo de frames da animação estável e profissional
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
  fab: { position: 'absolute', right: 25, bottom: 25, width: 60, height: 60, backgroundColor: '#6d59db', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 35 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 25, padding: 25, alignItems: 'center' },
  modalHeader: {fontSize: 18, fontWeight: 'bold', marginBottom: 15},
  input: { backgroundColor: '#f5f5f5', width: '100%', padding: 15, borderRadius: 12, marginBottom: 12 },
  saveButton: { backgroundColor: '#6d59db', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  // ADICIONADO: Estilos organizados para a nova barra de Ordenação Inteligente
  filterBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 8 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  filterBtnActive: { backgroundColor: '#6d59db' },
  filterBtnText: { color: '#666', fontWeight: '600', fontSize: 13 },
  filterBtnTextActive: { color: '#fff' }
});