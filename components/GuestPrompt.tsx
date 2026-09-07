import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const INDIGO = '#4F46E5';

interface Props {
  title?: string;
  message?: string;
}

export default function GuestPrompt({
  title = 'Sign in to continue',
  message = 'Create a free account to access all features',
}: Props) {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  return (
    <View style={s.container}>
      <View style={[s.iconCircle, { backgroundColor: colors.indigoMuted }]}>
        <User size={28} color={INDIGO} />
      </View>
      <Text style={[s.title, { color: colors.text }]}>{title}</Text>
      <Text style={[s.message, { color: colors.textSub }]}>{message}</Text>
      <Pressable style={s.primaryBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={s.primaryText}>Sign In</Text>
      </Pressable>
      <Pressable
        style={[s.secondaryBtn, { borderColor: colors.borderStrong }]}
        onPress={() => navigation.navigate('Signup')}
      >
        <Text style={[s.secondaryText, { color: colors.text }]}>Create Account</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  iconCircle:   { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title:        { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  message:      { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  primaryBtn:   { width: '100%', backgroundColor: INDIGO, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  primaryText:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryBtn: { width: '100%', borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryText:{ fontSize: 15, fontWeight: '600' },
});
