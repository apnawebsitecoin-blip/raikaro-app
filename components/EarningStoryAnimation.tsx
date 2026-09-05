import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { ShoppingCart, PenLine, Wallet } from 'lucide-react-native';

const STEPS = [
  { label: 'Kharida!',      Icon: ShoppingCart, iconColor: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  { label: 'Review Likha!', Icon: PenLine,       iconColor: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
  { label: '₹ Mila!',       Icon: Wallet,        iconColor: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
];

const FLIP_DURATION = 350;
const HOLD_DURATION = 1800;

export default function EarningStoryAnimation() {
  const [frontStep, setFrontStep] = useState(0);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Float loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 900, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim]);

  // Flip cycle
  useEffect(() => {
    let cancelled = false;

    const runCycle = () => {
      if (cancelled) return;
      // Phase 1: rotate to 90° (card goes edge-on)
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: FLIP_DURATION,
        useNativeDriver: true,
      }).start(() => {
        if (cancelled) return;
        // Swap content at midpoint
        setFrontStep((s) => (s + 1) % STEPS.length);
        // Phase 2: rotate back to 0°
        flipAnim.setValue(-1);
        Animated.timing(flipAnim, {
          toValue: 0,
          duration: FLIP_DURATION,
          useNativeDriver: true,
        }).start(() => {
          if (cancelled) return;
          // Hold, then repeat
          setTimeout(runCycle, HOLD_DURATION);
        });
      });
    };

    const timer = setTimeout(runCycle, HOLD_DURATION);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scale pulse on step change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.06, duration: 160, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 160, useNativeDriver: true }),
    ]).start();
  }, [frontStep, scaleAnim]);

  const rotateY = flipAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-90deg', '0deg', '90deg'],
  });

  const { Icon, iconColor, bg, border, label } = STEPS[frontStep];

  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Animated.View
        style={{
          transform: [
            { perspective: 1000 },
            { rotateY },
            { translateY: floatAnim },
            { scale: scaleAnim },
          ],
          backgroundColor: bg,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: border,
          paddingHorizontal: 28,
          paddingVertical: 18,
          alignItems: 'center',
          shadowColor: iconColor,
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
          minWidth: 160,
        }}
      >
        <Icon size={36} color={iconColor} />
        <Text style={{ fontSize: 16, fontWeight: '800', color: iconColor, marginTop: 10, letterSpacing: 0.3 }}>
          {label}
        </Text>
      </Animated.View>

      {/* Step dots */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === frontStep ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === frontStep ? '#4F46E5' : '#D1D5DB',
            }}
          />
        ))}
      </View>
    </View>
  );
}
