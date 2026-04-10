import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface AlertSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export default function AlertSettings({ visible, onClose }: AlertSettingsProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  // Carrega os dados salvos quando o modal abrir
  useEffect(() => {
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  const loadUserData = async () => {
    try {
      const savedNome = await AsyncStorage.getItem('@user_nome');
      const savedEmail = await AsyncStorage.getItem('@user_email');
      if (savedNome) setNome(savedNome);
      if (savedEmail) setEmail(savedEmail);
    } catch (e) {
      console.error("Erro ao carregar dados do usuário");
    }
  };

  const handleSave = async () => {
    if (!nome || !email) {
      Alert.alert("Aviso", "Por favor, preencha todos os campos.");
      return;
    }

    try {
      await AsyncStorage.setItem('@user_nome', nome);
      await AsyncStorage.setItem('@user_email', email);
      Alert.alert("Sucesso", "Configurações de alerta salvas!");
      onClose();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar os dados.");
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Configurar Alertas</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            value={nome}
            onChangeText={setNome}
          />

          <TextInput
            style={styles.input}
            placeholder="E-mail para notificar"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', backgroundColor: '#fff', padding: 25, borderRadius: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#6d59db', textAlign: 'center' },
  input: { borderBottomWidth: 1, borderColor: '#eee', marginBottom: 20, padding: 10, fontSize: 16 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelButton: { padding: 10, marginRight: 15 },
  cancelText: { color: '#999', fontWeight: '600' },
  saveButton: { backgroundColor: '#6d59db', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10 },
  saveText: { color: '#fff', fontWeight: 'bold' }
});