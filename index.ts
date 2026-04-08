import { registerRootComponent } from 'expo';
import App from './App'; // importa o App.tsx (o mapa de rotas)

// O registerRootComponent vai carregar o NavigationContainer 
// que você configurou no App.tsx, permitindo que o 'navigation' funcione.
registerRootComponent(App);