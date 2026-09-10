import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function MaintenanceScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={s.container}>
        <View style={[s.iconWrap, { backgroundColor: colors.amberMuted ?? '#FEF3C7' }]}>
          <Wrench size={40} color="#D97706" />
        </View>
        <Text style={[s.title, { color: colors.text }]}>Down for maintenance</Text>
        <Text style={[s.sub, { color: colors.textSub }]}>
          We're making improvements to the app. Please check back shortly.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap:  { width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title:     { fontSize: 22, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  sub:       { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
