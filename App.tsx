import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/app/store';
import { RootNavigator } from './src/ui/navigation/RootNavigator';

// App-shell (ADR-058): alleen providers + de navigatie-fundering. Alle state,
// hooks en businesslogica leven in de gedeelde store (src/app/store.tsx);
// schermen staan in src/ui/screens/ en delen die store via context.
export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
