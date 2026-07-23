import React from 'react';
import { Platform, SafeAreaView, useWindowDimensions, View } from 'react-native';
import { StatusBar, StatusBarStyle } from 'expo-status-bar';
import { styles } from './styles/appStyles';
import { AmbientBlobs, BottomNav } from './primitives';

// Schermkaders (ADR-058): de vroegere buitenste App-layout (root, ambient-lagen,
// SafeArea, gecentreerd appFrame met web-rand) is ongewijzigd overgenomen en nu
// per scherm beschikbaar. SurfaceFrame voegt de bestaande bottomNav toe;
// FlowFrame is dezelfde omlijsting zonder bottomNav voor flow- en modalschermen.

function Frame({ statusBar, withNav, children }: { statusBar: StatusBarStyle; withNav: boolean; children: React.ReactNode }) {
  const { height } = useWindowDimensions();
  return (
    <View style={[styles.root, { minHeight: height }]}>
      <StatusBar style={statusBar} />
      <AmbientBlobs />
      <SafeAreaView style={styles.safe}>
        <View style={[styles.appFrame, Platform.OS === 'web' && styles.webAppFrame]}>
          {children}
          {withNav ? <BottomNav /> : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

export function SurfaceFrame({ children }: { children: React.ReactNode }) {
  return <Frame statusBar="dark" withNav>{children}</Frame>;
}

export function FlowFrame({ statusBar = 'dark', children }: { statusBar?: StatusBarStyle; children: React.ReactNode }) {
  return <Frame statusBar={statusBar} withNav={false}>{children}</Frame>;
}
