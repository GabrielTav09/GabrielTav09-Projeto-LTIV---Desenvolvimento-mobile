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
  Image,
  Modal 
} from 'react-native';

// Importações do Firebase
import { auth } from './firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';

import LogoImg from './assets/logo.png';

export default function LoginScreen({ navigation }: any) {
  // Estados da tela principal (Login)
  const [login, setLogin] = useState(''); 
  const [password, setPassword] = useState('');

  // Estados do Modal de Cadastro
  const [signUpVisible, setSignUpVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Estados do Modal de Esqueci a Senha
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Função para realizar o Login via Firebase
  const handleLogin = async () => {
    const emailLimpo = login.trim();
    const senhaLimpa = password.trim();

    if (emailLimpo === '' || senhaLimpa === '') {
      Alert.alert("Aviso", "Preencha todos os campos.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, emailLimpo, senhaLimpa);
      navigation.replace('Home');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        Alert.alert("Erro", "E-mail ou senha incorretos.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Erro", "Formato de e-mail inválido.");
      } else {
        Alert.alert("Erro", "Falha ao acessar os dados.");
      }
    }
  };

  // Função para Criar Conta
  const handleSignUp = async () => {
    const emailLimpo = newEmail.trim();
    const senhaLimpa = newPassword.trim();

    if (emailLimpo === '' || senhaLimpa === '') {
      Alert.alert("Aviso", "Preencha e-mail e senha para cadastrar.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, emailLimpo, senhaLimpa);
      Alert.alert("Sucesso", "Conta criada com sucesso! Agora você pode entrar.");
      setSignUpVisible(false);
      setNewEmail('');
      setNewPassword('');
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

  // Função para Redefinir Senha - Agora disparada de dentro do novo Modal
  const handleSendResetEmail = async () => {
    const emailLimpo = resetEmail.trim();

    if (emailLimpo === '') {
      Alert.alert("Atenção", "Por favor, digite o seu e-mail.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, emailLimpo);
      Alert.alert("Sucesso", "E-mail de redefinição enviado! Verifique sua caixa de entrada.");
      setForgotPasswordVisible(false); // Fecha o modal após enviar
      setResetEmail(''); // Limpa o campo
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        Alert.alert("Erro", "O formato do e-mail inserido é inválido.");
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert("Erro", "Este e-mail não está cadastrado no sistema.");
      } else {
        Alert.alert("Erro", "Não foi possível enviar o e-mail de redefinição.");
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.loginBox}>
        <Image source={LogoImg} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>TASKY</Text>
        <Text style={styles.subtitle}>Sua agenda inteligente</Text>

        <TextInput 
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
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
          <TouchableOpacity onPress={() => setSignUpVisible(true)}>
            <Text style={styles.footerLink}>Criar uma conta</Text>
          </TouchableOpacity>

          {/* Agora abre a janelinha de recuperação de senha */}
          <TouchableOpacity onPress={() => setForgotPasswordVisible(true)}>
            <Text style={styles.footerLink}>Esqueci a senha</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= MODAL DE CADASTRO ================= */}
      <Modal visible={signUpVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.title}>Nova Conta</Text>
            <Text style={styles.subtitle}>Preencha para se cadastrar</Text>

            <TextInput 
              style={styles.input}
              placeholder="Digite seu melhor E-mail"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={newEmail}
              onChangeText={setNewEmail}
            />

            <TextInput 
              style={styles.input}
              placeholder="Crie uma Senha (min. 6 caracteres)"
              placeholderTextColor="#999"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Cadastrar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSignUpVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL DE RECOVERY (ESQUECI A SENHA) ================= */}
      <Modal visible={forgotPasswordVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.title}>Recuperar Acesso</Text>
            <Text style={styles.subtitle}>Enviaremos um link de redefinição</Text>

            <TextInput 
              style={styles.input}
              placeholder="Digite o e-mail da sua conta"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={resetEmail}
              onChangeText={setResetEmail}
            />

            <TouchableOpacity style={styles.button} onPress={handleSendResetEmail}>
              <Text style={styles.buttonText}>Enviar E-mail</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setForgotPasswordVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  logo: {
    width: 120, 
    height: 120, 
    marginBottom: 10, 
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
  },
  cancelText: {
    color: '#999',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
