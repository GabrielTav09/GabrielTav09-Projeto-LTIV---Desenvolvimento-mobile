import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, Alert 
} from 'react-native';
// CORREÇÃO: Importando o SafeAreaView correto que respeita a barra de status no Android e iOS
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Categoria {
  id: string;
  name: string;
  color: string;
}

const PALETA_CORES = ['#6d59db', '#ff5252', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c'];

export default function CategorizationScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PALETA_CORES[0]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const docRef = doc(db, 'user_categories', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCategories(docSnap.data().categories || []);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar categorias.");
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return Alert.alert("Erro", "Digite o nome da categoria.");
    
    const newCategory: Categoria = {
      id: Date.now().toString() + Math.random().toString(),
      name: categoryName.trim(),
      color: selectedColor
    };

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);

    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'user_categories', user.uid);
        await setDoc(docRef, { categories: updatedCategories });
        setCategoryName('');
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar categoria na nuvem.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const updatedCategories = categories.filter(cat => cat.id !== id);
    setCategories(updatedCategories);

    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'user_categories', user.uid);
        await setDoc(docRef, { categories: updatedCategories });
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao excluir categoria.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categorias</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.form}>
        <TextInput 
        placeholder="Nome da Categoria (Ex: Trabalho)" 
        placeholderTextColor="#888888" // <-- Adicione isso aqui também
        style={styles.input} 
        value={categoryName} 
        onChangeText={setCategoryName} 
        />

        <Text style={styles.label}>Selecione uma Cor:</Text>
        <View style={styles.paletteContainer}>
          {PALETA_CORES.map(cor => (
            <TouchableOpacity
              key={cor}
              style={[styles.colorCircle, { backgroundColor: cor }, selectedColor === cor && styles.colorCircleSelected]}
              onPress={() => setSelectedColor(cor)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategory}>
          <Text style={styles.buttonText}>Criar Categoria</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { marginHorizontal: 25, marginTop: 20 }]}>Minhas Categorias existentes:</Text>

      <FlatList
        data={categories}
        keyExtractor={(item, index) => item.id + '-' + index}
        contentContainerStyle={{ paddingHorizontal: 25, paddingTop: 10 }}
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <View style={styles.categoryInfo}>
              <View style={[styles.indicator, { backgroundColor: item.color }]} />
              <Text style={styles.categoryNameText}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteCategory(item.id)}>
              <Text style={styles.deleteText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  backBtn: { padding: 8 },
  backBtnText: { color: '#6d59db', fontWeight: 'bold', fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#6d59db' },
  form: { padding: 25, backgroundColor: '#f9f9f9', borderRadius: 20, margin: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 10 },
  paletteContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, justifyContent: 'space-between' },
  colorCircle: { width: 35, height: 35, borderRadius: 17.5, margin: 4 },
  colorCircleSelected: { borderWidth: 3, borderColor: '#000' },
  saveButton: { backgroundColor: '#6d59db', padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  categoryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginBottom: 8 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center' },
  indicator: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  categoryNameText: { fontSize: 16, fontWeight: '600', color: '#333' },
  deleteText: { color: '#d32f2f', fontWeight: 'bold' }
});