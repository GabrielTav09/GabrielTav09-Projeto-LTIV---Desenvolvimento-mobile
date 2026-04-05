import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importando os arquivos das telas que estão na sua pasta my_list1
import LoginScreen from './Login';
import HomeScreen from './Home';

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
            title: 'Task',
            headerLeft: () => null, // Remove o botão de voltar após o login por segurança
          }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}