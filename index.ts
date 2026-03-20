import { registerRootComponent } from 'expo';
import App from './App'; // Agora ele importa o App.tsx (o mapa de rotas)

// O registerRootComponent agora vai carregar o NavigationContainer 
// que você configurou no App.tsx, permitindo que o 'navigation' funcione.
registerRootComponent(App);