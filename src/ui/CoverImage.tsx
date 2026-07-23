import React, { useEffect, useState } from 'react';
import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../design/theme';

// Echte beeldlaag (ADR-057, Horizon A): expo-image met cover-fit, fade-transition
// en schijfcache. De placeholder is een zacht theme-kleurveld; bij een mislukte
// load blijft dat rustige kleurveld staan — nooit een kapot beeld.
// Horizon B: `imageContainerStyle` accepteert een Reanimated-stijl rond alleen
// het beeld (Ken Burns / beeldcontinuïteit), zonder de tekstlagen mee te schalen.

type CoverImageProps = {
  uri?: string;
  style?: StyleProp<ViewStyle>;
  /** Randradius/opacity van de afbeelding zelf (zoals ImageBackground imageStyle). */
  imageStyle?: StyleProp<ImageStyle>;
  /** Optionele geanimeerde stijl rond de beeldcontainer (Reanimated). */
  imageContainerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function CoverImage({ uri, style, imageStyle, imageContainerStyle, children }: CoverImageProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return (
    <View style={style}>
      <View style={[StyleSheet.absoluteFill, imageStyle, styles.placeholder]} />
      {uri && !failed ? (
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, imageContainerStyle]}>
          <Image
            source={{ uri }}
            style={[StyleSheet.absoluteFill, imageStyle]}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            onError={() => setFailed(true)}
            accessibilityIgnoresInvertColors
          />
        </Reanimated.View>
      ) : null}
      {children}
    </View>
  );
}

/**
 * Leesbaarheids-overlay over fotografie: één vloeiende gradient in plaats van de
 * vroegere twee vlakke rgba-rechthoeken met zichtbare knik. De onderzijde blijft
 * donker genoeg voor on-image tekst; de bovenrand krijgt een zachte kap zodat
 * ook top-tekst (pill, statuslabel) leesbaar blijft.
 */
export function ImageShade() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(6,9,8,0.34)', 'rgba(6,9,8,0.06)', 'rgba(6,9,8,0.30)', 'rgba(6,9,8,0.68)']}
      locations={[0, 0.32, 0.58, 1]}
      style={StyleSheet.absoluteFill}
    />
  );
}

/** Zachte kap zonder leesbare tekst, voor sfeerlagen zoals de Presence-achtergrond. */
export function DimShade({ opacity = 0.74 }: { opacity?: number }) {
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(5,8,7,${opacity})` }]} />;
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: colors.panelRaised },
});
