import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function useShimmer() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
    return () => opacity.stopAnimation();
  }, [opacity]);
  return opacity;
}

function SkeletonBox({ width, height, radius = 8, style }: { width: number | string; height: number; radius?: number; style?: any }) {
  const { colors } = useTheme();
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[{ width: width as number, height, borderRadius: radius, backgroundColor: colors.cardAlt, opacity }, style]}
    />
  );
}

export function SkeletonProductCard() {
  const { colors } = useTheme();
  const CARD_W = (SCREEN_WIDTH - 48) / 2;
  return (
    <View style={{ width: CARD_W, backgroundColor: colors.card, borderRadius: 14, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
      <SkeletonBox width="100%" height={120} radius={10} style={{ marginBottom: 8 }} />
      <SkeletonBox width="80%" height={12} radius={4} style={{ marginBottom: 6 }} />
      <SkeletonBox width="50%" height={12} radius={4} style={{ marginBottom: 8 }} />
      <SkeletonBox width="60%" height={16} radius={4} />
    </View>
  );
}

export function SkeletonBalanceCard() {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.cardAlt, borderRadius: 20, padding: 24, marginBottom: 16 }}>
      <SkeletonBox width={120} height={14} radius={4} style={{ marginBottom: 12 }} />
      <SkeletonBox width={160} height={40} radius={6} style={{ marginBottom: 20 }} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <SkeletonBox width={120} height={38} radius={12} />
        <SkeletonBox width={100} height={38} radius={12} />
      </View>
    </View>
  );
}
