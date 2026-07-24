import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/app/store';
import { useAppearance } from './src/design/theme';
import { RootNavigator } from './src/ui/navigation/RootNavigator';

// App-shell (ADR-058): alleen providers + de navigatie-fundering. Alle state,
// hooks en businesslogica leven in de gedeelde store (src/app/store.tsx);
// schermen staan in src/ui/screens/ en delen die store via context.
// ADR-064: useAppearance() synchroniseert het tokenpalet met het
// toesteluiterlijk vóór de kinderen renderen; bij een appearance-wissel
// herrendert de root en kleurt alles mee.
export default function App() {
  useAppearance();
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
