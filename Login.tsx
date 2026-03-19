import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // FUNÇÃO DE LOGIN E CADASTRO AUTOMÁTICO
  const handleLogin = async () => {
    if (email === '' || senha === '') {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    try {
      const storedData = await AsyncStorage.getItem('@usuario_logado');
      
      if (storedData === null) {
        // --- FLUXO DE CADASTRO ---
        const novoUsuario = JSON.stringify({ email, senha });
        await AsyncStorage.setItem('@usuario_logado', novoUsuario);
        
        Alert.alert("Sucesso", "Usuário cadastrado com sucesso!", [
          { 
            text: "Entrar no App", 
            onPress: () => navigation.replace('Home') // Navega após o cadastro
          }
        ]);
      } else {
        // --- FLUXO DE LOGIN ---
        const usuarioValido = JSON.parse(storedData);
        
        if (email === usuarioValido.email && senha === usuarioValido.senha) {
          // Se os dados estão corretos, entra direto
          navigation.replace('Home'); 
        } else {
          Alert.alert("Erro", "E-mail ou senha incorretos.");
        }
      }
    } catch (e) {
      Alert.alert("Erro", "Falha ao acessar o armazenamento.");
    }
  };

  // FUNÇÃO PARA RESETAR OS DADOS (Esqueci a senha)
  const handleForgotPassword = () => {
    Alert.alert(
      "Esqueceu a Senha?",
      "Deseja limpar todos os dados salvos neste dispositivo? Você precisará criar um novo usuário.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Resetar", 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@usuario_logado');
              setEmail('');
              setSenha('');
              Alert.alert("Sucesso", "Memória limpa! Crie um novo acesso.");
            } catch (e) {
              Alert.alert("Erro", "Falha ao limpar os dados.");
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Meu App</Text>
        
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
          secureTextEntry 
          value={senha} 
          onChangeText={setSenha} 
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar / Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPassword}>
          <Text style={styles.forgotButtonText}>Esqueceu a senha? (Resetar App)</Text>
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
    padding: 20 
  },
  card: { 
    width: '100%', 
    backgroundColor: '#f8f5fd', 
    borderRadius: 20, 
    padding: 30, 
    alignItems: 'center', 
    elevation: 5 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#c6b6ff', 
    marginBottom: 30 
  },
  input: { 
    width: '100%', 
    height: 50, 
    backgroundColor: '#e5e5fa', 
    borderRadius: 10, 
    paddingHorizontal: 15, 
    color: '#000', 
    marginBottom: 15 
  },
  button: { 
    width: '100%', 
    height: 50, 
    backgroundColor: '#6d59db', 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 10
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  forgotButton: {
    marginTop: 20,
    padding: 10
  },
  forgotButtonText: {
    color: '#6d59db',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline'
  }
});