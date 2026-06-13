import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importações do Firebase para gerenciar as tarefas excluídas
import { auth, db } from './firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface TarefaDeletada {
  id: string;
  title: string;
  description: string;
  time: string;
  deletedAt: string;
  originalDate: string;
}

export default function BinScreen({ navigation }: any) {
  const [deletedTasks, setDeletedTasks] = useState<TarefaDeletada[]>([]);

  // Dispara a busca da lixeira assim que a tela abre
  useEffect(() => {
    loadTrashTasks();
  }, []);

  // Carrega e filtra tarefas excluídas há menos de 60 dias
  const loadTrashTasks = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'user_trash', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const allTrash: TarefaDeletada[] = docSnap.data().deletedTasks || [];
        const agora = new Date().getTime();
        const sessentaDiasEmMs = 60 * 24 * 60 * 60 * 1000;

        // Filtra tirando tudo que já passou de 60 dias da lixeira
        const validTrash = allTrash.filter(task => {
          const tempoPassado = agora - new Date(task.deletedAt).getTime();
          return tempoPassado < sessentaDiasEmMs;
        });

        setDeletedTasks(validTrash);

        // Se houveram itens expirados deletados pelo filtro, limpa eles do banco em segundo plano
        if (validTrash.length !== allTrash.length) {
          await setDoc(docRef, { deletedTasks: validTrash });
        }
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao acessar tarefas da lixeira.");
    }
  };

  // Função para recuperar a tarefa, retornando ela para a Home e limpando do banco da lixeira
  const recoverTask = async (task: TarefaDeletada) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Devolve a tarefa para a lista ativa da Home (user_tasks) na sua data original
      const tasksRef = doc(db, 'user_tasks', user.uid);
      const tasksSnap = await getDoc(tasksRef);
      let activeTasks: Record<string, any> = {};

      if (tasksSnap.exists()) {
        activeTasks = tasksSnap.data().tasks || {};
      }

      if (!activeTasks[task.originalDate]) {
        activeTasks[task.originalDate] = [];
      }

      // Reconstrói o molde original da tarefa limpa (sem os dados da lixeira)
      const tarefaRestaurada = {
        id: task.id,
        title: task.title,
        description: task.description,
        time: task.time,
        status: 'pendente'
      };

      activeTasks[task.originalDate].push(tarefaRestaurada);
      await setDoc(tasksRef, { tasks: activeTasks });

      // Remove este item da lista de lixeira (user_trash)
      const trashRef = doc(db, 'user_trash', user.uid);
      const updatedTrash = deletedTasks.filter(t => t.id !== task.id);

      setDeletedTasks(updatedTrash);
      await setDoc(trashRef, { deletedTasks: updatedTrash });

      Alert.alert("Sucesso", "Tarefa restaurada com sucesso para a sua agenda!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível recuperar a tarefa.");
    }
  };

  // Executa a exclusão definitiva manual do banco de dados
  const permanentDeleteTask = async (id: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'user_trash', user.uid);
      const updatedTrash = deletedTasks.filter(t => t.id !== id);

      setDeletedTasks(updatedTrash);
      await setDoc(docRef, { deletedTasks: updatedTrash });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível remover permanentemente.");
    }
  };

  // Mensagem atualizada informando que a ação é irreversível e perderá o item permanentemente
  const confirmPermanentDelete = (id: string) => {
    Alert.alert(
      "Exclusão Definitiva",
      "Deseja apagar permanentemente este item? Caso exclua da lixeira, não poderá recuperar mais a tarefa em questão.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar", style: "destructive", onPress: () => permanentDeleteTask(id) }
      ]
    );
  };

  // Calcula quantos dias restam com base no limite de 60 dias
  const calcularDiasRestantes = (deletedAtStr: string) => {
    const dataDelecao = new Date(deletedAtStr).getTime();
    const agora = new Date().getTime();
    const tempoPassado = agora - dataDelecao;
    const sessentaDiasEmMs = 60 * 24 * 60 * 60 * 1000;
    const tempoRestante = sessentaDiasEmMs - tempoPassado;

    const dias = Math.ceil(tempoRestante / (1000 * 60 * 60 * 24));
    return dias > 0 ? `${dias} dias restantes` : "Expirando hoje";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Lixeira</Text>
        <View style={{ width: 60 }} /> 
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Itens Apagados</Text>
        <Text style={styles.sectionDate}>{deletedTasks.length} itens</Text>
      </View>

      {/* Lista de tarefas dentro da lixeira */}
      <FlatList
        data={deletedTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              {item.description ? <Text style={styles.taskDescription}>{item.description}</Text> : null}
              <Text style={styles.taskInfo}>⏰ Horário original: {item.time}</Text>
              <Text style={styles.expirationText}>⏳ {calcularDiasRestantes(item.deletedAt)}</Text>
            </View>

            {/* ADICIONADO: Lado direito agrupando os botões de recuperar e apagar em definitivo */}
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => recoverTask(item)}>
                <Text style={styles.recoverText}>Recuperar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => confirmPermanentDelete(item.id)}>
                <Text style={styles.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma tarefa na lixeira.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5, backgroundColor: '#ffffff' },
  topBarTitle: { fontSize: 24, fontWeight: 'bold', color: '#6d59db', flex: 1, textAlign: 'center', marginRight: 40 }, 
  backBtn: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 10, justifyContent: 'center' },
  backText: { color: '#666', fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#6d59db' },
  sectionDate: { color: '#888' },
  taskCard: { padding: 15, marginHorizontal: 20, marginVertical: 4, backgroundColor: '#f9f9f9', borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  taskDescription: { fontSize: 14, color: '#666', marginTop: 2 },
  taskInfo: { fontSize: 12, color: '#999', marginTop: 4 },
  expirationText: { fontSize: 12, color: '#d32f2f', fontWeight: '600', marginTop: 4 },
  // ADICIONADO: Estilos para organizar os botões de ação na lixeira
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  recoverText: { color: '#6d59db', fontWeight: 'bold', marginRight: 12 },
  deleteText: { color: '#d32f2f', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 }
});
