import React, { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

// Licht-curve ("licht de komende uren", concept v2). Geen react-native-svg in
// dit project: de lijn bestaat uit korte View-segmenten tussen de samples
// (geroteerd rond hun middelpunt), met dunne invulbalkjes als zachte area en
// één accent-punt op de piek. Volledig deterministisch uit nowModel.lightCurveModel.

type LightCurveProps = {
  values: number[];
  peakIndex: number;
  accentColor: string;
  fillColor: string;
  trackColor: string;
  height?: number;
};

export function LightCurve({ values, peakIndex, accentColor, fillColor, trackColor, height = 36 }: LightCurveProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  if (values.length < 2) return <View style={{ height }} onLayout={onLayout} />;
  const padY = 4;
  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * Math.max(0, width),
    y: padY + (1 - value) * (height - padY * 2 - 4),
  }));
  const segments = points.slice(1).map((point, index) => {
    const previous = points[index];
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const angle = `${Math.atan2(dy, dx)}rad`;
    return { midX: (point.x + previous.x) / 2, midY: (point.y + previous.y) / 2, length, angle, key: index };
  });
  const peak = points[Math.min(peakIndex, points.length - 1)];
  const barWidth = Math.max(2, width / values.length - 3);
  return (
    <View style={{ height, width: '100%' }} onLayout={onLayout}>
      {width > 0 && (
        <>
          {/* Basislijn */}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: trackColor }} />
          {/* Zachte area-invulling onder de lijn */}
          {points.map((point, index) => (
            <View
              key={`fill-${index}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: Math.max(0, point.x - barWidth / 2),
                top: point.y + 2,
                width: barWidth,
                height: Math.max(0, height - 1 - point.y - 2),
                backgroundColor: fillColor,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }}
            />
          ))}
          {/* De lijn zelf */}
          {segments.map((segment) => (
            <View
              key={`seg-${segment.key}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: segment.midX - segment.length / 2,
                top: segment.midY - 1,
                width: segment.length,
                height: 2,
                borderRadius: 1,
                backgroundColor: accentColor,
                transform: [{ rotate: segment.angle }],
              }}
            />
          ))}
          {/* Piekmarcering */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: peak.x - 3.5,
              top: peak.y - 3.5,
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: accentColor,
              borderWidth: 1.5,
              borderColor: 'rgba(11,13,19,0.9)',
            }}
          />
        </>
      )}
    </View>
  );
}
