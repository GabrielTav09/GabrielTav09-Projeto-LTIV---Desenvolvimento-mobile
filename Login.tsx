import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    if (email === '' || senha === '') {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    try {
      const storedData = await AsyncStorage.getItem('@usuario_logado');
      
      if (storedData === null) {
        const novoUsuario = JSON.stringify({ email, senha });
        await AsyncStorage.setItem('@usuario_logado', novoUsuario);
        Alert.alert("Sucesso", "Usuário cadastrado! Entre agora.");
      } else {
        const usuarioValido = JSON.parse(storedData);
        if (email === usuarioValido.email && senha === usuarioValido.senha) {
          navigation.replace('Home'); // Joga o usuário para a tela principal
        } else {
          Alert.alert("Erro", "E-mail ou senha incorretos.");
        }
      }
    } catch (e) {
      Alert.alert("Erro", "Falha ao acessar o armazenamento.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Meu App</Text>
        <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar / Cadastrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', backgroundColor: '#f8f5fd', borderRadius: 20, padding: 30, alignItems: 'center', elevation: 5 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#c6b6ff', marginBottom: 30 },
  input: { width: '100%', height: 50, backgroundColor: '#e5e5fa', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15 },
  button: { width: '100%', height: 50, backgroundColor: '#6d59db', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});