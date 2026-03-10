import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    if (email === '' || senha === '') {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    try {
      // 1. Tenta buscar um usuário já salvo no "celular"
      const storedData = await AsyncStorage.getItem('@usuario_logado');
      
      if (storedData === null) {
        // Se não existe ninguém, vamos CADASTRAR este primeiro
        const novoUsuario = JSON.stringify({ email, senha });
        await AsyncStorage.setItem('@usuario_logado', novoUsuario);
        Alert.alert("Sucesso", "Primeiro acesso! Usuário cadastrado com sucesso.");
      } else {
        // Se já existe, vamos COMPARAR
        const usuarioValido = JSON.parse(storedData);

        if (email === usuarioValido.email && senha === usuarioValido.senha) {
          Alert.alert("Bem-vindo!", "Login realizado com sucesso!");
        } else {
          Alert.alert("Erro", "E-mail ou senha incorretos.");
        }
      }
    } catch (e) {
      Alert.alert("Erro", "Falha ao acessar o armazenamento.");
    }
  };

  // Função para limpar os dados (útil para testes)
  const limparDados = async () => {
    await AsyncStorage.removeItem('@usuario_logado');
    Alert.alert("Limpo", "Cadastro removido para novos testes.");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.card}>
        <Text style={styles.title}>Meu App</Text>
        <Text style={styles.subtitle}>Digite seus dados para entrar</Text>

        <TextInput 
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput 
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#999"
          secureTextEntry={true}
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar / Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={limparDados} style={{marginTop: 20}}>
          <Text style={{color: '#666'}}>Resetar Cadastro (Teste)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#f8f5fd',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#c6b6ff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#4d4d4d',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#e5e5fa',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#fff',
    marginBottom: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#6d59db', // Cor que você usou nos testes anteriores
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});