import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Suas chaves reais do Tasky-App
const firebaseConfig = {
  apiKey: "AIzaSyCc0ZpJVDIkOWwmzN5mNMb-RQmbd_ztVGE",
  authDomain: "tasky-app-aa881.firebaseapp.com",
  projectId: "tasky-app-aa881",
  storageBucket: "tasky-app-aa881.firebasestorage.app",
  messagingSenderId: "324828994548",
  appId: "1:324828994548:web:8f3315bea8aa4f641d77a1",
  measurementId: "G-NX77MZBZQD"
};

// Inicializa o núcleo do Firebase
const app = initializeApp(firebaseConfig);

// Inicializa a Autenticação configurada para o ambiente Mobile (Expo)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializa o Banco de Dados para salvar as tarefas futuramente
const db = getFirestore(app);

// Exporta as conexões para as telas de Login e Home usarem
export { auth, db };