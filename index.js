// Horizon B (ADR-057): react-native-gesture-handler vereist import als eerste
// entry-module én een GestureHandlerRootView rond de volledige app; zonder deze
// wrapper worden pan/swipe-gebaren niet herkend.
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import App from './App';

function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <App />
    </GestureHandlerRootView>
  );
}

registerRootComponent(Root);
