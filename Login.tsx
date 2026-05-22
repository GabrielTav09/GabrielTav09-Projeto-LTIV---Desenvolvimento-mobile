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
// Importações do Firebase
import { auth } from './firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';

// DIRETÓRIO: O './' indica que a pasta assets está na mesma raiz do arquivo Login.tsx
import LogoImg from './assets/logo.png';

export default function LoginScreen({ navigation }: any) {
  const [login, setLogin] = useState(''); 
  const [password, setPassword] = useState('');


// Função para realizar o Login via Firebase
  const handleLogin = async () => {
    const emailLimpo = login.trim(); // Dica: o Firebase usa e-mail como login
    const senhaLimpa = password.trim();

    if (emailLimpo === '' || senhaLimpa === '') {
      Alert.alert("Aviso", "Preencha todos os campos.");
      return;
    }

    try {
      // Faz login na nuvem do Firebase
      await signInWithEmailAndPassword(auth, emailLimpo, senhaLimpa);
      navigation.replace('Home');
    } catch (error: any) {
      // Trata erros comuns do Firebase
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        Alert.alert("Erro", "E-mail ou senha incorretos.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Erro", "Formato de e-mail inválido.");
      } else {
        Alert.alert("Erro", "Falha ao acessar os dados.");
      }
    }
  };

  // Função para Criar Conta - Agora via Firebase
  const handleSignUp = async () => {
    const emailLimpo = login.trim();
    const senhaLimpa = password.trim();

    if (emailLimpo === '' || senhaLimpa === '') {
      Alert.alert("Aviso", "Preencha e-mail e senha para cadastrar.");
      return;
    }

    try {
      // Cria o usuário diretamente no painel Authentication
      await createUserWithEmailAndPassword(auth, emailLimpo, senhaLimpa);
      Alert.alert("Sucesso", "Conta criada com sucesso!");
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Conta já existente", "Este e-mail já está cadastrado.");
      } else if (error.code === 'auth/weak-password') {
        Alert.alert("Senha Fraca", "A senha precisa ter pelo menos 6 caracteres.");
      } else {
        Alert.alert("Erro", "Não foi possível realizar o cadastro.");
      }
    }
  };

  // Função para Redefinir - Agora envia um e-mail de recuperação oficial do Firebase
  const handleForgotPassword = () => {
    const emailLimpo = login.trim();

    if (emailLimpo === '') {
      Alert.alert("Atenção", "Digite seu e-mail no campo 'Login' para redefinir.");
      return;
    }

    Alert.alert(
      "Redefinir Acesso",
      `Deseja receber um link de redefinição de senha no e-mail: ${emailLimpo}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Enviar", 
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, emailLimpo);
              Alert.alert("Sucesso", "E-mail de redefinição enviado! Verifique sua caixa de entrada.");
            } catch (error: any) {
              Alert.alert("Erro", "Não foi possível enviar o e-mail de redefinição.");
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
          placeholder="E-mail" // Mudou para indicar que agora é e-mail
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address" // Adicionado para abrir o teclado com o "@" fácil
          autoComplete="email" // Ajuda o celular a autocompletar o e-mail do usuário
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