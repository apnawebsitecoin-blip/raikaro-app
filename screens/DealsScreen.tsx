import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DealsScreen() {
  return (
    <View style={s.container}>
      <Text style={s.text}>Coming soon — Deals</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  text:      { fontSize: 20, fontWeight: '600', color: '#374151' },
});
