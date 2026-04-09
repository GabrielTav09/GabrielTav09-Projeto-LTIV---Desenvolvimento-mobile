import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Image // Componente para renderizar a logo
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// DIRETÓRIO: O './' indica que a pasta assets está na mesma raiz do arquivo Login.tsx
import LogoImg from './assets/logo.png'; 

export default function LoginScreen({ navigation }: any) {
  const [login, setLogin] = useState(''); 
  const [password, setPassword] = useState('');

  // Função para realizar o Login - Funcionalidade Mantida
  const handleLogin = async () => {
    const loginLimpo = login.trim();
    const senhaLimpa = password.trim();

    if (loginLimpo === '' || senhaLimpa === '') {
      Alert.alert("Aviso", "Preencha todos os campos.");
      return;
    }

    try {
      const savedUser = await AsyncStorage.getItem('@user_credentials');
      if (savedUser) {
        const { login: storedLogin, password: storedPassword } = JSON.parse(savedUser);

        if (loginLimpo === storedLogin && senhaLimpa === storedPassword) {
          navigation.replace('Home');
        } else {
          Alert.alert("Erro", "Login ou senha incorretos.");
        }
      } else {
        Alert.alert("Erro", "Nenhum usuário cadastrado.");
      }
    } catch (e) {
      Alert.alert("Erro", "Falha ao acessar os dados.");
    }
  };

  // Função para Criar Conta - Funcionalidade Mantida (Não sobrescreve se já existir)
  const handleSignUp = async () => {
    const loginLimpo = login.trim();
    const senhaLimpa = password.trim();

    if (loginLimpo === '' || senhaLimpa === '') {
      Alert.alert("Aviso", "Preencha login e senha para cadastrar.");
      return;
    }

    try {
      const existingUser = await AsyncStorage.getItem('@user_credentials');

      if (existingUser) {
        Alert.alert(
          "Conta já existente", 
          "Já existe um usuário cadastrado. Use 'Esqueci a senha' para alterar."
        );
        return; 
      }

      const userData = { login: loginLimpo, password: senhaLimpa };
      await AsyncStorage.setItem('@user_credentials', JSON.stringify(userData));
      Alert.alert("Sucesso", "Conta criada com sucesso!");
      
    } catch (e) {
      Alert.alert("Erro", "Não foi possível realizar o cadastro.");
    }
  };

  // Função para Redefinir - Funcionalidade Mantida
  const handleForgotPassword = () => {
    Alert.alert(
      "Redefinir Acesso",
      "Deseja substituir o login e senha atuais pelos dados digitados acima?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Redefinir", 
          onPress: async () => {
            const loginLimpo = login.trim();
            const senhaLimpa = password.trim();

            if (loginLimpo !== '' && senhaLimpa !== '') {
              const userData = { login: loginLimpo, password: senhaLimpa };
              await AsyncStorage.setItem('@user_credentials', JSON.stringify(userData));
              Alert.alert("Sucesso", "Seus dados de acesso foram atualizados!");
            } else {
              Alert.alert("Atenção", "Digite o novo login e senha antes de redefinir.");
            }
          } 
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.loginBox}>
        
        {/* LOGO ADICIONADA AQUI */}
        <Image 
          source={LogoImg} 
          style={styles.logo} 
          resizeMode="contain" 
        />

        <Text style={styles.title}>TASKY</Text>
        <Text style={styles.subtitle}>Sua agenda inteligente</Text>

        <TextInput 
          style={styles.input}
          placeholder="Login" 
          placeholderTextColor="#999"
          autoCapitalize="none"
          value={login}
          onChangeText={setLogin}
        />

        <TextInput 
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.footerLink}>Criar uma conta</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.footerLink}>Esqueci a senha</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d8d4f0', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBox: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  // ESTILO DA LOGO
  logo: {
    width: 120, // Tamanho ajustado para visibilidade
    height: 120, 
    marginBottom: 10, // Espaço entre a logo e o texto TASKY
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6d59db',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#333'
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#6d59db',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  footerLink: {
    color: '#6d59db',
    fontSize: 13,
    fontWeight: '600',
  },
});