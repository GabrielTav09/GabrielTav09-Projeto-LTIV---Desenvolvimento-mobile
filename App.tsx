import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importando os arquivos das telas que estão na sua pasta my_list1
import LoginScreen from './Login';
import HomeScreen from './Home';

// ADICIONADO: Importação do arquivo de código da lixeira para registro na rota
import BinScreen from './Bin';

// ADICIONADO: Importação do arquivo de código de categorização para registro na rota
import CategorizationScreen from './categorization';

// Criando a pilha de navegação
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6d59db', // Cor roxa que você escolheu
          },
          headerTintColor: '#fff', // Cor do texto do cabeçalho
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        
        {/* Tela de Login - Sem cabeçalho para o visual ficar limpo */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />

        {/* Tela Principal - Nomeada como 'Home' para o navigation.replace('Home') funcionar */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            title: 'TASKY',
            headerLeft: () => null, // Remove o botão de voltar após o login por segurança
          }} 
        />

        {/* ADICIONADO: Tela da Lixeira - Definida como 'Bin' para o menu da Home redirecionar corretamente */}
        {/* OBS: Opcionalmente definimos 'headerShown: false' porque a tela bin.tsx já possui um topo personalizado com botão de voltar */}
        <Stack.Screen 
          name="Bin" 
          component={BinScreen} 
          options={{ headerShown: false }} 
        />

        {/* ADICIONADO: Tela de Categorias - Definida como 'Categorization' para o menu hambúrguer da Home redirecionar corretamente */}
        {/* OBS: Definimos 'headerShown: false' porque a tela categorization.tsx já foi estruturada com um topo personalizado e botão nativo de voltar */}
        <Stack.Screen 
          name="Categorization" 
          component={CategorizationScreen} 
          options={{ headerShown: false }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}