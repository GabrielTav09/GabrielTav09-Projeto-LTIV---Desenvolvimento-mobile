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
      <Stack.Navigator initialRouteName="Login">
        
        {/* Tela de Login - Sem cabeçalho para o visual ficar limpo */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />

        {/* Tela Principal - Ela já está preparada para receber o navigation.replace */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            title: 'Minha Lista',
            headerStyle: { backgroundColor: '#6d59db' },
            headerTintColor: '#fff',
          }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}